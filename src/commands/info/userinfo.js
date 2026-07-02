module.exports = {
  meta: {
    name: 'userinfo',
    aliases: ['ui'],
    category: 'info',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 0, max: 1, usage: 'userinfo [@user]' },
    descriptionKey: 'info.descriptions.userinfo',
    guildOnly: true
  },
  async execute({ message, args, respond, t }) {
    const member = args[0]
      ? await message.guild.members.fetch(args[0].replace(/[^\d]/g, '')).catch(() => null)
      : message.member;

    if (!member) {
      return;
    }

    await respond({
      title: member.user.tag,
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      fields: [
        { name: t('common.labels.id'), value: member.id, inline: true },
        { name: t('common.labels.joined'), value: member.joinedAt?.toISOString() || '-', inline: true },
        { name: t('common.labels.created'), value: member.user.createdAt.toISOString(), inline: true }
      ],
      description: member.user.toString()
    });
  }
};

