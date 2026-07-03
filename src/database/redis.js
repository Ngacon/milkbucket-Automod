const Redis = require('ioredis');

function createRedis(logger) {
  const client = new Redis(process.env.REDIS_URL, {
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'milkbucket:',
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableAutoPipelining: true
  });

  client.on('error', (error) => {
    logger.error('Redis client emitted an error', { error });
  });

  client.on('connect', () => {
    logger.info('Redis connected');
  });

  client.on('reconnecting', () => {
    logger.warn('Redis reconnecting');
  });

  return client;
}

const REDIS_CONNECT_TIMEOUT_MS = Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 10_000);

async function initializeRedis(client) {
  const connectPromise = (async () => {
    await client.connect();
    await client.ping();
  })();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Redis connection timed out after ${REDIS_CONNECT_TIMEOUT_MS}ms`)), REDIS_CONNECT_TIMEOUT_MS)
  );

  await Promise.race([connectPromise, timeoutPromise]).catch(async (error) => {
    // Disconnect the client to prevent background reconnection noise
    try {
      client.disconnect();
    } catch {
      // ignore disconnect errors
    }
    throw error;
  });
}

async function closeRedis(client) {
  if (!client) {
    return;
  }

  await client.quit();
}

module.exports = {
  createRedis,
  initializeRedis,
  closeRedis
};
