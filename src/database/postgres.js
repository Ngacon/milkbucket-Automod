const { Pool } = require('pg');
const { APP_NAME, DEFAULT_LOCALE } = require('../config/constants');
const { AUTO_SYNC_SCHEMA } = require('../config/feature-flags');

function createPostgres(logger) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    application_name: APP_NAME,
    max: Number(process.env.PG_POOL_MAX || 20),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 10_000)
  });

  pool.on('error', (error) => {
    logger.error('PostgreSQL pool emitted an error', { error });
  });

  return pool;
}

async function initializePostgres(pool, logger) {
  await pool.query('SELECT 1');

  if (!AUTO_SYNC_SCHEMA) {
    logger.info('PostgreSQL schema sync is disabled');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      prefix VARCHAR(32),
      locale VARCHAR(10) NOT NULL DEFAULT '${DEFAULT_LOCALE}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS warnings (
      id BIGSERIAL PRIMARY KEY,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS automod_settings (
      guild_id TEXT PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      antilink BOOLEAN NOT NULL DEFAULT FALSE,
      antiinvite BOOLEAN NOT NULL DEFAULT FALSE,
      antispam BOOLEAN NOT NULL DEFAULT FALSE,
      antidup BOOLEAN NOT NULL DEFAULT FALSE,
      anticaps BOOLEAN NOT NULL DEFAULT FALSE,
      antimention INTEGER NOT NULL DEFAULT 0,
      antiraid BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE automod_settings
    ADD COLUMN IF NOT EXISTS badwords BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS webhookspam BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS selfbot BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS botraid BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS delete_message BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS autowarn BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS time_window_seconds INTEGER NOT NULL DEFAULT 600,
    ADD COLUMN IF NOT EXISTS spam_allowed_channel_ids TEXT[];
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS automod_words (
      guild_id TEXT NOT NULL,
      word TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (guild_id, word)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS automod_thresholds (
      guild_id TEXT NOT NULL,
      warns INTEGER NOT NULL,
      action VARCHAR(32) NOT NULL,
      duration INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (guild_id, warns)
    );
  `);

  await pool.query(`
    ALTER TABLE automod_thresholds
    ADD COLUMN IF NOT EXISTS message TEXT;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS automod_whitelist (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      added_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (guild_id, user_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS modlog_config (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS autorole_settings (
      guild_id TEXT PRIMARY KEY,
      role_id TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reaction_roles (
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (message_id, emoji)
    );
  `);

  // ── Dashboard / shared tables ─────────────────────────────────────

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Guild" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "iconUrl" TEXT,
      "ownerId" TEXT NOT NULL,
      "memberCount" INTEGER NOT NULL DEFAULT 0,
      "channelCount" INTEGER NOT NULL DEFAULT 0,
      "roleCount" INTEGER NOT NULL DEFAULT 0,
      prefix TEXT NOT NULL DEFAULT 'm!',
      language TEXT NOT NULL DEFAULT 'vi',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "logChannelId" TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Member" (
      id TEXT NOT NULL,
      "guildId" TEXT NOT NULL REFERENCES "Guild"(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      "displayName" TEXT,
      discriminator TEXT,
      "avatarUrl" TEXT,
      bot BOOLEAN NOT NULL DEFAULT FALSE,
      "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      roles TEXT NOT NULL DEFAULT '[]',
      PRIMARY KEY (id, "guildId")
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Mute" (
      id SERIAL PRIMARY KEY,
      "guildId" TEXT NOT NULL REFERENCES "Guild"(id) ON DELETE CASCADE,
      "userId" TEXT NOT NULL,
      "moderatorId" TEXT NOT NULL,
      reason TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "expiresAt" TIMESTAMPTZ
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Ban" (
      id SERIAL PRIMARY KEY,
      "guildId" TEXT NOT NULL REFERENCES "Guild"(id) ON DELETE CASCADE,
      "userId" TEXT NOT NULL,
      "moderatorId" TEXT NOT NULL,
      reason TEXT NOT NULL,
      soft BOOLEAN NOT NULL DEFAULT FALSE,
      hackban BOOLEAN NOT NULL DEFAULT FALSE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "AutoModConfig" (
      id SERIAL PRIMARY KEY,
      "guildId" TEXT NOT NULL REFERENCES "Guild"(id) ON DELETE CASCADE,
      feature TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      threshold INTEGER NOT NULL DEFAULT 0,
      action TEXT NOT NULL DEFAULT 'warn',
      "warnLimit" INTEGER NOT NULL DEFAULT 3,
      UNIQUE ("guildId", feature)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "dashboard_warnings" (
      id SERIAL PRIMARY KEY,
      "guildId" TEXT NOT NULL REFERENCES "Guild"(id) ON DELETE CASCADE,
      "userId" TEXT NOT NULL,
      "moderatorId" TEXT NOT NULL,
      reason TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "dashboard_badwords" (
      id SERIAL PRIMARY KEY,
      "guildId" TEXT NOT NULL REFERENCES "Guild"(id) ON DELETE CASCADE,
      word TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE ("guildId", word)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "dashboard_reaction_roles" (
      id SERIAL PRIMARY KEY,
      "guildId" TEXT NOT NULL REFERENCES "Guild"(id) ON DELETE CASCADE,
      "messageId" TEXT NOT NULL,
      "channelId" TEXT NOT NULL,
      emoji TEXT NOT NULL,
      "roleId" TEXT NOT NULL,
      "roleName" TEXT NOT NULL,
      revoked BOOLEAN NOT NULL DEFAULT FALSE,
      "syncStatus" TEXT NOT NULL DEFAULT 'synced',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "CommandLog" (
      id SERIAL PRIMARY KEY,
      "guildId" TEXT NOT NULL REFERENCES "Guild"(id) ON DELETE CASCADE,
      "commandName" TEXT NOT NULL,
      category TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      username TEXT NOT NULL,
      args TEXT NOT NULL DEFAULT '',
      success BOOLEAN NOT NULL DEFAULT TRUE,
      "durationMs" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "AutoModEvent" (
      id SERIAL PRIMARY KEY,
      "guildId" TEXT NOT NULL REFERENCES "Guild"(id) ON DELETE CASCADE,
      feature TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  logger.info('PostgreSQL schema is ready');
}

async function closePostgres(pool) {
  if (!pool) {
    return;
  }

  await pool.end();
}

module.exports = {
  createPostgres,
  initializePostgres,
  closePostgres
};
