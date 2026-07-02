module.exports = {
  meta: {
    name: 'avatar',
    aliases: ['av'],
    category: 'info',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 0, max: 1, usage: 'avatar [@user]' },
    descriptionKey: 'info.descriptions.avatar',
    guildOnly: false
  },
  async execute({ message, args, respond }) {
    const user =
      message.mentions.users.first() ||
      (args[0] ? await message.client.users.fetch(args[0].replace(/[^\d]/g, '')).catch(() => null) : null) ||
      message.author;

    const url = user.displayAvatarURL({ size: 512 });
    await respond({
      title: user.tag,
      thumbnail: url,
      description: url
    });
  }
};

