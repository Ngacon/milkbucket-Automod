async function registerReactionRemoveEvent({ client, reactionRoleRepo, logger }) {
  client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) {
      return;
    }

    try {
      if (reaction.partial) {
        await reaction.fetch();
      }

      const messageId = reaction.message.id;
      const entries = await reactionRoleRepo.getByMessage(messageId);
      if (entries.length === 0) {
        return;
      }

      const entry = entries.find((item) => item.emoji === reaction.emoji.toString());
      if (!entry) {
        return;
      }

      const guild = reaction.message.guild;
      if (!guild) {
        return;
      }

      const member = await guild.members.fetch(user.id);
      const role = guild.roles.cache.get(entry.role_id);
      if (!role) {
        return;
      }

      await member.roles.remove(role);
    } catch (error) {
      logger.error('Reaction role remove failed', { error });
    }
  });
}

module.exports = {
  registerReactionRemoveEvent
};
