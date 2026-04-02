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
    CREATE TABLE IF NOT EXISTS automod_words (
      guild_id TEXT NOT NULL,
      word TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (guild_id, word)
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
