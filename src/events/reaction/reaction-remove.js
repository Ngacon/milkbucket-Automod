const { applyReactionRoleAction } = require('../../services/reaction-role-service');

async function registerReactionRemoveEvent({ client, reactionRoleRepo, logger }) {
  client.on('messageReactionRemove', async (reaction, user) => {
    await applyReactionRoleAction({
      reaction,
      user,
      action: 'remove',
      reactionRoleRepo,
      logger
    });
  });
}

module.exports = {
  registerReactionRemoveEvent
};
