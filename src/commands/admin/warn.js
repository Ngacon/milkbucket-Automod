const { resolveMember } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'warn',
    aliases: [],
    category: 'admin',
    permissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    cooldown: 2,
    args: { min: 1, max: 20, usage: 'warn @user [reason]' },
    descriptionKey: 'admin.descriptions.warn',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const targetArg = args.shift();
    const reason = args.join(' ').trim() || null;
    const member = await resolveMember(message, targetArg);

    if (!member) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const warning = await repos.warningsRepo.addWarning({
      guildId: message.guild.id,
      userId: member.id,
      moderatorId: message.author.id,
      reason
    });

    await respond({
      author: {
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ size: 128 })
      },
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      description: t('admin.responses.warnAdded', {
        user: member.user.tag,
        id: warning.id
      })
    });
  }
};

