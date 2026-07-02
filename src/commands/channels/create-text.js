const { ChannelType } = require('discord.js');

module.exports = {
  meta: {
    name: 'create-text',
    aliases: [],
    category: 'channels',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 1, max: 10, usage: 'create-text [name]' },
    descriptionKey: 'channels.descriptions.createText',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const name = args.join('-').toLowerCase();
    const channel = await message.guild.channels.create({
      name,
      type: ChannelType.GuildText
    });
    await respond({
      description: t('channels.responses.channelCreated', { name: channel.name })
    });
  }
};

