module.exports = {
  meta: {
    name: 'ship',
    aliases: [],
    category: 'fun',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 2, max: 2, usage: 'ship @user1 @user2' },
    descriptionKey: 'fun.descriptions.ship',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const user1 = message.mentions.users.at(0) || message.author;
    const user2 = message.mentions.users.at(1) || message.client.users.cache.get(args[1]) || message.author;
    const percent = Math.floor(Math.random() * 101);
    await respond({
      author: {
        name: `${user1.username} ❤ ${user2.username}`,
        iconURL: user1.displayAvatarURL({ size: 128 })
      },
      thumbnail: user2.displayAvatarURL({ size: 256 }),
      description: t('fun.responses.ship', {
        user1: user1.username,
        user2: user2.username,
        percent
      })
    });
  }
};

