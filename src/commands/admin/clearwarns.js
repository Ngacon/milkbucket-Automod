const { resolveMember } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'clearwarns',
    aliases: [],
    category: 'admin',
    permissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'clearwarns @user' },
    descriptionKey: 'admin.descriptions.clearwarns',
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

    await repos.warningsRepo.clearWarnings({
      guildId: message.guild.id,
      userId: member.id
    });

    await respond({
      author: {
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ size: 128 })
      },
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      description: t('admin.responses.warningsCleared', { user: member.user.tag })
    });
  }
};

