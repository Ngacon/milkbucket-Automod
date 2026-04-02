function installGlobalExceptionHandlers({ logger, client }) {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', {
      reason,
      promise
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
      error
    });
  });

  if (client) {
    client.on('error', (error) => {
      logger.error('Discord client error', { error });
    });

    client.on('warn', (warning) => {
      logger.warn('Discord client warning', { warning });
    });

    client.on('shardError', (error, shardId) => {
      logger.error('Discord shard error', {
        error,
        shardId
      });
    });
  }
}

module.exports = {
  installGlobalExceptionHandlers
};
