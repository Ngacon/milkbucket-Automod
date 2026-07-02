module.exports = {
  meta: {
    name: 'membercount',
    aliases: ['members'],
    category: 'info',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'membercount' },
    descriptionKey: 'info.descriptions.membercount',
    guildOnly: true
  },
  async execute({ message, respond }) {
    await respond({
      description: `${message.guild.memberCount}`
    });
  }
};

