const { resolveMember, getModerationBlock } = require('../../app/command-utils');
const { BOT_EMOJIS, EMBED_COLORS } = require('../../config/constants');
const { sendModerationLog } = require('../../services/moderation/modlog');

module.exports = {
  meta: {
    name: 'kick',
    aliases: [],
    category: 'admin',
    permissions: ['KickMembers'],
    botPermissions: ['KickMembers'],
    cooldown: 2,
    args: { min: 1, max: 10, usage: 'kick @user [reason]' },
    descriptionKey: 'admin.descriptions.kick',
    guildOnly: true
  },
  async execute({ message, args, t, respond, repos }) {
    const targetArg = args.shift();
    const reason = args.join(' ').trim() || null;
    const member = await resolveMember(message, targetArg);

    if (!member) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const moderationBlock = getModerationBlock('kick', member);
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

    await member.kick(reason || undefined);
    await sendModerationLog({
      guild: message.guild,
      repos,
      color: EMBED_COLORS.ERROR,
      title: t('moderation.responses.logTitle', {
        action: t('moderation.actions.kick')
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
      description: t('common.responses.success')
    });
  }
};

