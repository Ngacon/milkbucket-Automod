const { resolveRole } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'roleinfo',
    aliases: ['ri'],
    category: 'info',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 1, max: 5, usage: 'roleinfo [@role]' },
    examples: ['roleinfo @Moderator'],
    descriptionKey: 'info.descriptions.roleinfo',
    guildOnly: true
  },
  async execute({ message, args, respond, t, colors }) {
    const role = resolveRole(message, args.join(' '));

    if (!role) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const memberCount = role.members.size;
    const roleColor = role.hexColor && role.hexColor !== '#000000'
      ? role.hexColor
      : '#FFFFFF';

    await respond({
      color: role.color || colors.PRIMARY,
      title: role.name,
      description: t('info.responses.roleinfoSummary', {
        role: role.toString()
      }),
      fields: [
        {
          name: t('common.labels.id'),
          value: role.id,
          inline: true
        },
        {
          name: t('common.labels.color'),
          value: roleColor,
          inline: true
        },
        {
          name: t('common.labels.position'),
          value: `${role.position}`,
          inline: true
        },
        {
          name: t('common.labels.members'),
          value: `${memberCount}`,
          inline: true
        },
        {
          name: t('common.labels.mention'),
          value: role.toString(),
          inline: true
        },
        {
          name: t('common.labels.created'),
          value: role.createdAt.toISOString(),
          inline: false
        }
      ]
    });
  }
};
