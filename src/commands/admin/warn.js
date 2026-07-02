const { resolveMember } = require('../../app/command-utils');
const { EMBED_COLORS } = require('../../config/constants');
const { sendModerationLog } = require('../../services/moderation/modlog');

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

    const config = await repos.automodRepo.getConfig(message.guild.id);
    const warnCount = await repos.warningsRepo.countWarningsWithinWindow({
      guildId: message.guild.id,
      userId: member.id,
      timeWindowSeconds: config.timeWindow
    });

    await sendModerationLog({
      guild: message.guild,
      repos,
      color: EMBED_COLORS.WARNING,
      title: t('moderation.responses.logTitle', {
        action: t('moderation.actions.warn')
      }),
      description: reason || t('moderation.responses.noReason'),
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      fields: [
        {
          name: t('moderation.labels.user'),
          value: `${member.user.tag} (${member.id})`,
          inline: false
        },
        {
          name: t('moderation.labels.moderator'),
          value: `${message.author.tag} (${message.author.id})`,
          inline: false
        },
        {
          name: t('moderation.labels.warningId'),
          value: `${warning.id}`,
          inline: true
        },
        {
          name: t('moderation.labels.warnCount'),
          value: `${warnCount}`,
          inline: true
        },
        {
          name: t('moderation.labels.reason'),
          value: reason || t('moderation.responses.noReason'),
          inline: false
        }
      ]
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

