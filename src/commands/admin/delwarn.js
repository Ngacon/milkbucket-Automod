module.exports = {
  meta: {
    name: 'delwarn',
    aliases: [],
    category: 'admin',
    permissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'delwarn [id]' },
    descriptionKey: 'admin.descriptions.delwarn',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond, client }) {
    const warningId = Number(args[0]);
    if (!Number.isFinite(warningId)) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const deleted = await repos.warningsRepo.deleteWarning({
      guildId: message.guild.id,
      warningId
    });

    if (!deleted) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const fetched = await message.guild.members.fetch(message.author.id).catch(() => null);
    await respond({
      author: fetched
        ? {
            name: fetched.user.tag,
            iconURL: fetched.user.displayAvatarURL({ size: 128 })
          }
        : undefined,
      thumbnail: fetched ? fetched.user.displayAvatarURL({ size: 256 }) : undefined,
      description: t('admin.responses.warningDeleted', { id: warningId })
    });
  }
};

