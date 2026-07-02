const { applyReactionRoleAction } = require('../../services/reaction-role-service');

async function registerReactionAddEvent({ client, reactionRoleRepo, logger }) {
  client.on('messageReactionAdd', async (reaction, user) => {
    await applyReactionRoleAction({
      reaction,
      user,
      action: 'add',
      reactionRoleRepo,
      logger
    });
  });
}

module.exports = {
  registerReactionAddEvent
};
