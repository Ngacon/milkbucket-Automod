const { resolveMember } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'warnings',
    aliases: [],
    category: 'admin',
    permissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'warnings @user' },
    descriptionKey: 'admin.descriptions.warnings',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const member = await resolveMember(message, args[0]);

    if (!member) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const warnings = await repos.warningsRepo.getWarnings({
      guildId: message.guild.id,
      userId: member.id
    });

    if (warnings.length === 0) {
      await respond({
        description: t('admin.responses.warningsEmpty')
      });
      return;
    }

    await respond({
      title: t('admin.responses.warningsHeader', { user: member.user.tag }),
      author: {
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ size: 128 })
      },
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      fields: warnings.map((warning) => ({
        name: `#${warning.id}`,
        value: warning.reason || '-',
        inline: false
      }))
    });
  }
};

