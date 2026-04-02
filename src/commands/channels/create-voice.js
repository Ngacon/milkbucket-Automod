const { ChannelType } = require('discord.js');

module.exports = {
  meta: {
    name: 'create-voice',
    aliases: [],
    category: 'channels',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 1, max: 10, usage: 'create-voice [name]' },
    descriptionKey: 'channels.descriptions.createVoice',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const name = args.join('-').toLowerCase();
    const channel = await message.guild.channels.create({
      name,
      type: ChannelType.GuildVoice
    });
    await respond({
      description: t('channels.responses.channelCreated', { name: channel.name })
    });
  }
};

