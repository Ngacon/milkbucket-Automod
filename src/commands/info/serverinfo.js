module.exports = {
  meta: {
    name: 'serverinfo',
    aliases: ['si'],
    category: 'info',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'serverinfo' },
    descriptionKey: 'info.descriptions.serverinfo',
    guildOnly: true
  },
  async execute({ message, respond, t }) {
    const guild = message.guild;
    await respond({
      title: guild.name,
      fields: [
        { name: t('common.labels.id'), value: guild.id, inline: true },
        { name: t('common.labels.members'), value: `${guild.memberCount}`, inline: true },
        { name: t('common.labels.created'), value: guild.createdAt.toISOString(), inline: true }
      ]
    });
  }
};

