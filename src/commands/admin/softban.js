const { resolveMember, getModerationBlock } = require('../../app/command-utils');
const { BOT_EMOJIS } = require('../../config/constants');

module.exports = {
  meta: {
    name: 'softban',
    aliases: [],
    category: 'admin',
    permissions: ['BanMembers'],
    botPermissions: ['BanMembers'],
    cooldown: 2,
    args: { min: 1, max: 10, usage: 'softban @user [reason]' },
    examples: ['softban @user spam link'],
    descriptionKey: 'admin.descriptions.softban',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const targetArg = args.shift();
    const reason = args.join(' ').trim() || null;
    const member = await resolveMember(message, targetArg);

    if (!member) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const moderationBlock = getModerationBlock('softban', member);
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

    await member.ban({
      reason: reason || undefined,
      deleteMessageSeconds: 7 * 24 * 60 * 60
    });
    await message.guild.members.unban(member.id, reason || undefined);

    await respond({
      author: {
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ size: 128 })
      },
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      description: t('admin.responses.softbanDone', {
        user: member.user.tag
      })
    });
  }
};
