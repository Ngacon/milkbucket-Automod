const {
  parseDuration,
  formatDuration,
  resolveMember,
  getModerationBlock
} = require('../../app/command-utils');
const { BOT_EMOJIS, EMBED_COLORS } = require('../../config/constants');
const { sendModerationLog } = require('../../services/moderation/modlog');

module.exports = {
  meta: {
    name: 'mute',
    aliases: [],
    category: 'admin',
    permissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    cooldown: 2,
    args: { min: 2, max: 20, usage: 'mute @user [time] [reason]' },
    descriptionKey: 'admin.descriptions.mute',
    guildOnly: true
  },
  async execute({ message, args, t, respond, repos }) {
    const targetArg = args.shift();
    const durationArg = args.shift();
    const reason = args.join(' ').trim() || null;
    const duration = parseDuration(durationArg);
    const member = await resolveMember(message, targetArg);

    if (!member || !duration) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: t('admin.responses.invalidMuteInput')
      });
      return;
    }

    const moderationBlock = getModerationBlock('mute', member);
    if (moderationBlock) {
      await respond({
        color: 0xe74c3c,
        author: {
          name: member.user.tag,
          iconURL: member.user.displayAvatarURL({ size: 128 })
        },
        description: `${BOT_EMOJIS.HIERARCHY.mention} ${t(moderationBlock.key, moderationBlock.params)}`,
        thumbnail: BOT_EMOJIS.HIERARCHY.imageUrl
      });
      return;
    }

    await member.timeout(duration, reason || undefined);
    await sendModerationLog({
      guild: message.guild,
      repos,
      color: EMBED_COLORS.WARNING,
      title: t('moderation.responses.logTitle', {
        action: t('moderation.actions.mute')
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
          name: t('moderation.labels.duration'),
          value: formatDuration(duration),
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
      color: EMBED_COLORS.MUTED,
      title: t('admin.responses.muteTitle'),
      author: {
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ size: 128 })
      },
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      description: t('admin.responses.muteApplied', {
        user: member.user.tag,
        duration: formatDuration(duration)
      }),
      fields: [
        {
          name: t('moderation.labels.user'),
          value: `${member.user.tag}\n\`${member.id}\``,
          inline: true
        },
        {
          name: t('moderation.labels.duration'),
          value: formatDuration(duration),
          inline: true
        },
        {
          name: t('moderation.labels.reason'),
          value: reason || t('moderation.responses.noReason'),
          inline: false
        }
      ]
    });
  }
};
