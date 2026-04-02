module.exports = {
  meta: {
    name: 'poll',
    aliases: [],
    category: 'utility',
    permissions: ['ManageMessages'],
    botPermissions: ['AddReactions', 'ManageMessages'],
    cooldown: 2,
    args: { min: 1, max: 20, usage: 'poll [question]' },
    descriptionKey: 'utility.descriptions.poll',
    guildOnly: true
  },
  async execute({ message, args }) {
    const question = args.join(' ');
    const pollMessage = await message.channel.send(`📊 ${question}`);
    await pollMessage.react('👍');
    await pollMessage.react('👎');
  }
};

