function registerMessageCreateEvent({ client, router, moderationService, logger }) {
  client.on('messageCreate', async (message) => {
    try {
      if (moderationService) {
        const violation = await moderationService.handleMessage(message);
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
