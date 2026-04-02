module.exports = {
  meta: {
    name: 'show-channel',
    aliases: [],
    category: 'channels',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'show-channel' },
    descriptionKey: 'channels.descriptions.showChannel',
    guildOnly: true
  },
  async execute({ message, t, respond }) {
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      ViewChannel: null
    });
    await respond({
      description: t('channels.responses.channelShown')
    });
  }
};

