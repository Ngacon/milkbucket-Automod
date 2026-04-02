const { resolveMember, getModerationBlock } = require('../../app/command-utils');
const { BOT_EMOJIS } = require('../../config/constants');

module.exports = {
  meta: {
    name: 'unmute',
    aliases: [],
    category: 'admin',
    permissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'unmute @user' },
    descriptionKey: 'admin.descriptions.unmute',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const member = await resolveMember(message, args[0]);

    if (!member) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const moderationBlock = getModerationBlock('unmute', member);
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

    await member.timeout(null);
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

