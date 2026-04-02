const { extractId, resolveUser } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'hackban',
    aliases: [],
    category: 'admin',
    permissions: ['BanMembers'],
    botPermissions: ['BanMembers'],
    cooldown: 2,
    args: { min: 1, max: 10, usage: 'hackban [id] [reason]' },
    examples: ['hackban 123456789012345678 raid alt'],
    descriptionKey: 'admin.descriptions.hackban',
    guildOnly: true
  },
  async execute({ client, message, args, t, respond }) {
    const userId = extractId(args.shift());
    const reason = args.join(' ').trim() || null;

    if (!userId) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    await message.guild.members.ban(userId, { reason: reason || undefined });
    const user = await resolveUser(client, userId);

    await respond({
      author: user
        ? {
            name: user.tag,
            iconURL: user.displayAvatarURL({ size: 128 })
          }
        : undefined,
      thumbnail: user ? user.displayAvatarURL({ size: 256 }) : undefined,
      description: t('admin.responses.hackbanDone', {
        user: user?.tag || userId
      })
    });
  }
};
