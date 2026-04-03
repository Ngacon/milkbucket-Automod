async function registerGuildMemberAddEvent({ client, moderationService, autoroleRepo, logger }) {
  client.on('guildMemberAdd', async (member) => {
    try {
      if (moderationService) {
        const violation = await moderationService.handleGuildMemberAdd(member);
        if (violation) {
          return;
        }
      }

      const roleId = await autoroleRepo.getRole(member.guild.id);
      if (!roleId) {
        return;
      }

      const role = member.guild.roles.cache.get(roleId);
      if (!role) {
        return;
      }

      await member.roles.add(role);
    } catch (error) {
      logger.error('Failed to apply autorole', {
        error,
        guildId: member.guild.id,
        userId: member.id
      });
    }
  });
}

module.exports = {
  registerGuildMemberAddEvent
};
