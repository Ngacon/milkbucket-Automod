module.exports = {
  meta: {
    name: 'clone-channel',
    aliases: [],
    category: 'channels',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'clone-channel' },
    descriptionKey: 'channels.descriptions.cloneChannel',
    guildOnly: true
  },
  async execute({ message, t, respond }) {
    await message.channel.clone();
    await respond({
      description: t('channels.responses.channelCloned')
    });
  }
};

