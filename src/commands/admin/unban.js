const { extractId, resolveUser } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'unban',
    aliases: [],
    category: 'admin',
    permissions: ['BanMembers'],
    botPermissions: ['BanMembers'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'unban [id]' },
    descriptionKey: 'admin.descriptions.unban',
    guildOnly: true
  },
  async execute({ message, args, t, respond, client }) {
    const id = extractId(args[0]);
    if (!id || !message.guild) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    await message.guild.members.unban(id);
    const user = await resolveUser(client, id);
    await respond({
      author: user
        ? {
            name: user.tag,
            iconURL: user.displayAvatarURL({ size: 128 })
          }
        : undefined,
      thumbnail: user ? user.displayAvatarURL({ size: 256 }) : undefined,
      description: t('common.responses.success')
    });
  }
};

