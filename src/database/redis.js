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

async function initializeRedis(client) {
  await client.connect();
  await client.ping();
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
