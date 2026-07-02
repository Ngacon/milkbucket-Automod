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
    this.memoryCache = new Map();
  }

  buildCacheKey(guildId) {
    return `guild-settings:${guildId}`;
  }

  getMemoryCache(guildId) {
    const entry = this.memoryCache.get(guildId);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.memoryCache.delete(guildId);
      return null;
    }

    return entry.value;
  }

  setMemoryCache(settings) {
    if (!settings?.guildId) {
      return;
    }

    this.memoryCache.set(settings.guildId, {
      value: settings,
      expiresAt: Date.now() + SETTINGS_CACHE_TTL_SECONDS * 1000
    });
  }

  async readCache(guildId) {
    const memoryValue = this.getMemoryCache(guildId);
    if (memoryValue) {
      return memoryValue;
    }

    if (!ENABLE_REDIS_CACHE || !this.redis || !guildId) {
      return null;
    }

    const cacheKey = this.buildCacheKey(guildId);
    const cachedValue = await this.redis.get(cacheKey);

    if (!cachedValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(cachedValue);
      this.setMemoryCache(parsed);
      return parsed;
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
    if (!settings?.guildId) {
      return;
    }

    this.setMemoryCache(settings);

    if (!ENABLE_REDIS_CACHE || !this.redis) {
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

  async invalidateCache(guildId) {
    if (!guildId) {
      return;
    }

    this.memoryCache.delete(guildId);

    if (!ENABLE_REDIS_CACHE || !this.redis) {
      return;
    }

    await this.redis.del(this.buildCacheKey(guildId));
  }
}

module.exports = {
  GuildSettingsRepository
};
