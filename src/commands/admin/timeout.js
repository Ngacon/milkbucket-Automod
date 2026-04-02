const { parseDuration, resolveMember, getModerationBlock } = require('../../app/command-utils');
const { BOT_EMOJIS } = require('../../config/constants');

module.exports = {
  meta: {
    name: 'timeout',
    aliases: [],
    category: 'admin',
    permissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    cooldown: 2,
    args: { min: 2, max: 3, usage: 'timeout @user [time] [reason]' },
    descriptionKey: 'admin.descriptions.timeout',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const targetArg = args.shift();
    const durationArg = args.shift();
    const reason = args.join(' ').trim() || null;
    const duration = parseDuration(durationArg);
    const member = await resolveMember(message, targetArg);

    if (!member || !duration) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const moderationBlock = getModerationBlock('timeout', member);
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

