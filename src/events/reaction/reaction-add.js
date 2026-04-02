async function registerReactionAddEvent({ client, reactionRoleRepo, logger }) {
  client.on('messageReactionAdd', async (reaction, user) => {
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

      await member.roles.add(role);
    } catch (error) {
      logger.error('Reaction role add failed', { error });
    }
  });
}

module.exports = {
  registerReactionAddEvent
};
