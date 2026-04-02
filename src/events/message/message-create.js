function registerMessageCreateEvent({ client, router, automodService, logger }) {
  client.on('messageCreate', async (message) => {
    try {
      if (automodService) {
        const violation = await automodService.handleMessage(message);
        if (violation) {
          return;
        }
      }
      await router.handleMessage(message);
    } catch (error) {
      logger.error('messageCreate handler failed', {
        error,
        messageId: message.id,
        channelId: message.channelId
      });
    }
  });
}

module.exports = {
  registerMessageCreateEvent
};
