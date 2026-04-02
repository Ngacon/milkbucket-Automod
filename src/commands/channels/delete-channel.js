module.exports = {
  meta: {
    name: 'delete-channel',
    aliases: [],
    category: 'channels',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'delete-channel' },
    descriptionKey: 'channels.descriptions.deleteChannel',
    guildOnly: true
  },
  async execute({ message, t, respond }) {
    await message.channel.delete();
    await respond({
      description: t('channels.responses.channelDeleted')
    });
  }
};

