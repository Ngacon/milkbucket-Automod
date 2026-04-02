const {
  DEFAULT_LOCALE,
  SETTINGS_CACHE_TTL_SECONDS
} = require('../config/constants');
const { ENABLE_REDIS_CACHE } = require('../config/feature-flags');

class GuildSettingsRepository {
  constructor({ pool, redis, logger }) {
    this.pool = pool;
    this.redis = redis;
    this.logger = logger;
  }

  buildCacheKey(guildId) {
    return `guild-settings:${guildId}`;
  }

  async readCache(guildId) {
    if (!ENABLE_REDIS_CACHE || !this.redis || !guildId) {
      return null;
    }

    const cacheKey = this.buildCacheKey(guildId);
    const cachedValue = await this.redis.get(cacheKey);

    if (!cachedValue) {
      return null;
    }

    try {
      return JSON.parse(cachedValue);
    } catch (error) {
      this.logger.warn('Invalid guild settings cache payload', {
        guildId,
        error
      });
      await this.redis.del(cacheKey);
      return null;
    }
  }

  async writeCache(settings) {
    if (!ENABLE_REDIS_CACHE || !this.redis || !settings?.guildId) {
      return;
    }

    await this.redis.set(
      this.buildCacheKey(settings.guildId),
      JSON.stringify(settings),
      'EX',
      SETTINGS_CACHE_TTL_SECONDS
    );
  }

  async getSettings(guildId) {
    if (!guildId) {
      return {
        guildId: null,
        prefix: null,
        locale: DEFAULT_LOCALE
      };
    }

    const cachedSettings = await this.readCache(guildId);

    if (cachedSettings) {
      return cachedSettings;
    }

    const result = await this.pool.query(
      `
        SELECT guild_id, prefix, locale
        FROM guild_settings
        WHERE guild_id = $1
        LIMIT 1
      `,
      [guildId]
    );

    const row = result.rows[0];
    const settings = {
      guildId,
      prefix: row?.prefix || null,
      locale: row?.locale || DEFAULT_LOCALE
    };

    await this.writeCache(settings);
    return settings;
  }

  async getPrefix(guildId) {
    const settings = await this.getSettings(guildId);
    return settings.prefix;
  }

  async getLocale(guildId) {
    const settings = await this.getSettings(guildId);
    return settings.locale;
  }

  async setPrefix(guildId, prefix) {
    const result = await this.pool.query(
      `
        INSERT INTO guild_settings (guild_id, prefix, locale)
        VALUES ($1, $2, $3)
        ON CONFLICT (guild_id)
        DO UPDATE SET
          prefix = EXCLUDED.prefix,
          updated_at = NOW()
        RETURNING guild_id, prefix, locale
      `,
      [guildId, prefix, DEFAULT_LOCALE]
    );

    const row = result.rows[0];
    const settings = {
      guildId: row.guild_id,
      prefix: row.prefix || null,
      locale: row.locale || DEFAULT_LOCALE
    };

    await this.writeCache(settings);
    this.logger.info('Guild prefix updated', {
      guildId,
      prefix: settings.prefix
    });

    return settings;
  }

  async setLocale(guildId, locale) {
    const result = await this.pool.query(
      `
        INSERT INTO guild_settings (guild_id, prefix, locale)
        VALUES ($1, $2, $3)
        ON CONFLICT (guild_id)
        DO UPDATE SET
          locale = EXCLUDED.locale,
          updated_at = NOW()
        RETURNING guild_id, prefix, locale
      `,
      [guildId, null, locale]
    );

    const row = result.rows[0];
    const settings = {
      guildId: row.guild_id,
      prefix: row.prefix || null,
      locale: row.locale || DEFAULT_LOCALE
    };

    await this.writeCache(settings);
    this.logger.info('Guild locale updated', {
      guildId,
      locale: settings.locale
    });

    return settings;
  }
}

module.exports = {
  GuildSettingsRepository
};
