const { resolveMember, resolveUser, getModerationBlock } = require('../../app/command-utils');
const { BOT_EMOJIS } = require('../../config/constants');

module.exports = {
  meta: {
    name: 'ban',
    aliases: [],
    category: 'admin',
    permissions: ['BanMembers'],
    botPermissions: ['BanMembers'],
    cooldown: 2,
    args: { min: 1, max: 10, usage: 'ban @user [reason]' },
    descriptionKey: 'admin.descriptions.ban',
    guildOnly: true
  },
  async execute({ client, message, args, t, respond }) {
    const targetArg = args.shift();
    const reason = args.join(' ').trim() || null;
    const member = await resolveMember(message, targetArg);

    if (member) {
      const moderationBlock = getModerationBlock('ban', member);
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

      await member.ban({ reason: reason || undefined });
      await respond({
        author: {
          name: member.user.tag,
          iconURL: member.user.displayAvatarURL({ size: 128 })
        },
        thumbnail: member.user.displayAvatarURL({ size: 256 }),
        description: t('common.responses.success')
      });
      return;
    }

    const user = await resolveUser(client, targetArg);
    if (user && message.guild) {
      await message.guild.members.ban(user.id, { reason: reason || undefined });
      await respond({
        description: t('common.responses.success')
      });
      return;
    }

    await respond({
      description: t('common.responses.failure')
    });
  }
};

