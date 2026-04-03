const DEFAULT_THRESHOLDS = [
  { warns: 3, action: 'timeout', duration: 300 },
  { warns: 5, action: 'mute', duration: 900 },
  { warns: 7, action: 'kick', duration: null },
  { warns: 10, action: 'ban', duration: null }
];

class AutomodRepository {
  constructor({ pool, redis, logger }) {
    this.pool = pool;
    this.redis = redis;
    this.logger = logger;
  }

  buildConfigCacheKey(guildId) {
    return `automod-config:${guildId}`;
  }

  buildThresholdCacheKey(guildId) {
    return `automod-thresholds:${guildId}`;
  }

  buildModlogCacheKey(guildId) {
    return `modlog:${guildId}`;
  }

  async readJsonCache(key) {
    if (!this.redis || !key) {
      return null;
    }

    const payload = await this.redis.get(key);
    if (!payload) {
      return null;
    }

    try {
      return JSON.parse(payload);
    } catch (error) {
      this.logger?.warn('Invalid automod cache payload', { key, error });
      await this.redis.del(key);
      return null;
    }
  }

  async writeJsonCache(key, value, ttlSeconds = 3600) {
    if (!this.redis || !key) {
      return;
    }

    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async invalidateCaches(guildId) {
    if (!this.redis || !guildId) {
      return;
    }

    await this.redis.del(
      this.buildConfigCacheKey(guildId),
      this.buildThresholdCacheKey(guildId),
      this.buildModlogCacheKey(guildId)
    );
  }

  async ensureSettingsRow(guildId) {
    await this.pool.query(
      `
        INSERT INTO automod_settings (guild_id)
        VALUES ($1)
        ON CONFLICT (guild_id) DO NOTHING
      `,
      [guildId]
    );
  }

  normalizeThresholds(rows) {
    if (!rows || rows.length === 0) {
      return DEFAULT_THRESHOLDS.map((rule) => ({ ...rule }));
    }

    return rows
      .map((row) => ({
        warns: Number(row.warns),
        action: row.action,
        duration: row.duration == null ? null : Number(row.duration)
      }))
      .sort((left, right) => left.warns - right.warns);
  }

  async getThresholds(guildId) {
    const cacheKey = this.buildThresholdCacheKey(guildId);
    const cached = await this.readJsonCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.pool.query(
      `
        SELECT warns, action, duration
        FROM automod_thresholds
        WHERE guild_id = $1
        ORDER BY warns ASC
      `,
      [guildId]
    );

    const thresholds = this.normalizeThresholds(result.rows);
    await this.writeJsonCache(cacheKey, thresholds);
    return thresholds;
  }

  async upsertThreshold(guildId, warns, action, duration) {
    await this.pool.query(
      `
        INSERT INTO automod_thresholds (guild_id, warns, action, duration)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (guild_id, warns)
        DO UPDATE SET
          action = EXCLUDED.action,
          duration = EXCLUDED.duration,
          updated_at = NOW()
      `,
      [guildId, warns, action, duration == null ? null : duration]
    );

    await this.invalidateCaches(guildId);
    return this.getThresholds(guildId);
  }

  async getModlogChannelId(guildId) {
    const cacheKey = this.buildModlogCacheKey(guildId);
    const cached = await this.readJsonCache(cacheKey);
    if (cached && Object.prototype.hasOwnProperty.call(cached, 'channelId')) {
      return cached.channelId;
    }

    const result = await this.pool.query(
      `
        SELECT channel_id
        FROM modlog_config
        WHERE guild_id = $1
        LIMIT 1
      `,
      [guildId]
    );

    const channelId = result.rows[0]?.channel_id || null;
    await this.writeJsonCache(cacheKey, { channelId });
    return channelId;
  }

  async setModlogChannel(guildId, channelId) {
    await this.pool.query(
      `
        INSERT INTO modlog_config (guild_id, channel_id)
        VALUES ($1, $2)
        ON CONFLICT (guild_id)
        DO UPDATE SET
          channel_id = EXCLUDED.channel_id,
          updated_at = NOW()
      `,
      [guildId, channelId]
    );

    await this.invalidateCaches(guildId);
    return channelId;
  }

  mapConfig(row, thresholds, modlogChannelId) {
    return {
      guildId: row.guild_id,
      enabled: row.enabled,
      actions: {
        deleteMessage: row.delete_message,
        autowarn: row.autowarn
      },
      rules: {
        spam: row.antispam,
        badwords: row.badwords,
        caps: row.anticaps,
        mention: row.antimention > 0,
        webhook: row.webhookspam,
        selfbot: row.selfbot,
        botRaid: row.botraid,
        link: row.antilink,
        invite: row.antiinvite,
        duplicate: row.antidup
      },
      limits: {
        mentionMax: row.antimention
      },
      timeWindow: Number(row.time_window_seconds || 600),
      thresholds,
      modlogChannelId
    };
  }

  async getConfig(guildId) {
    const cacheKey = this.buildConfigCacheKey(guildId);
    const cached = await this.readJsonCache(cacheKey);
    if (cached) {
      return cached;
    }

    await this.ensureSettingsRow(guildId);
    const [settingsResult, thresholds, modlogChannelId] = await Promise.all([
      this.pool.query(
        `
          SELECT *
          FROM automod_settings
          WHERE guild_id = $1
          LIMIT 1
        `,
        [guildId]
      ),
      this.getThresholds(guildId),
      this.getModlogChannelId(guildId)
    ]);

    const row = settingsResult.rows[0];
    const config = this.mapConfig(row, thresholds, modlogChannelId);
    await this.writeJsonCache(cacheKey, config);
    return config;
  }

  async getSettings(guildId) {
    const config = await this.getConfig(guildId);
    return {
      guild_id: config.guildId,
      enabled: config.enabled,
      antilink: config.rules.link,
      antiinvite: config.rules.invite,
      antispam: config.rules.spam,
      antidup: config.rules.duplicate,
      anticaps: config.rules.caps,
      antimention: config.limits.mentionMax,
      antiraid: config.rules.webhook || config.rules.selfbot || config.rules.botRaid,
      badwords: config.rules.badwords,
      webhookspam: config.rules.webhook,
      selfbot: config.rules.selfbot,
      botraid: config.rules.botRaid,
      delete_message: config.actions.deleteMessage,
      autowarn: config.actions.autowarn,
      time_window_seconds: config.timeWindow,
      modlog_channel_id: config.modlogChannelId,
      thresholds: config.thresholds
    };
  }

  async setToggle(guildId, field, value) {
    const validFields = [
      'enabled',
      'antilink',
      'antiinvite',
      'antispam',
      'antidup',
      'anticaps',
      'antiraid',
      'badwords',
      'webhookspam',
      'selfbot',
      'botraid',
      'delete_message',
      'autowarn'
    ];

    if (!validFields.includes(field)) {
      throw new Error('Invalid automod field.');
    }

    await this.ensureSettingsRow(guildId);
    await this.pool.query(
      `
        UPDATE automod_settings
        SET ${field} = $2,
            updated_at = NOW()
        WHERE guild_id = $1
      `,
      [guildId, value]
    );

    await this.invalidateCaches(guildId);
    return this.getSettings(guildId);
  }

  async setAntiMention(guildId, maxMentions) {
    await this.ensureSettingsRow(guildId);
    await this.pool.query(
      `
        UPDATE automod_settings
        SET antimention = $2,
            updated_at = NOW()
        WHERE guild_id = $1
      `,
      [guildId, maxMentions]
    );

    await this.invalidateCaches(guildId);
    return this.getSettings(guildId);
  }

  async setTimeWindow(guildId, timeWindowSeconds) {
    await this.ensureSettingsRow(guildId);
    await this.pool.query(
      `
        UPDATE automod_settings
        SET time_window_seconds = $2,
            updated_at = NOW()
        WHERE guild_id = $1
      `,
      [guildId, timeWindowSeconds]
    );

    await this.invalidateCaches(guildId);
    return this.getSettings(guildId);
  }

  async addWord(guildId, word) {
    await this.pool.query(
      `
        INSERT INTO automod_words (guild_id, word)
        VALUES ($1, $2)
        ON CONFLICT (guild_id, word) DO NOTHING
      `,
      [guildId, word]
    );
  }

  async removeWord(guildId, word) {
    await this.pool.query(
      `
        DELETE FROM automod_words
        WHERE guild_id = $1 AND word = $2
      `,
      [guildId, word]
    );
  }

  async listWords(guildId) {
    const result = await this.pool.query(
      `
        SELECT word
        FROM automod_words
        WHERE guild_id = $1
        ORDER BY word ASC
      `,
      [guildId]
    );

    return result.rows.map((row) => row.word);
  }
}

module.exports = {
  AutomodRepository,
  DEFAULT_THRESHOLDS
};
