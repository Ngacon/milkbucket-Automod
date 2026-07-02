module.exports = {
  meta: {
    name: 'hide-channel',
    aliases: [],
    category: 'channels',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'hide-channel' },
    descriptionKey: 'channels.descriptions.hideChannel',
    guildOnly: true
  },
  async execute({ message, t, respond }) {
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      ViewChannel: false
    });
    await respond({
      description: t('channels.responses.channelHidden')
    });
  }
};

