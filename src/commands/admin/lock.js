module.exports = {
  meta: {
    name: 'lock',
    aliases: [],
    category: 'admin',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'lock' },
    examples: ['lock'],
    descriptionKey: 'admin.descriptions.lock',
    guildOnly: true
  },
  async execute({ message, t, respond }) {
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false
    });

    await respond({
      description: t('admin.responses.channelLocked', {
        channel: message.channel.name
      })
    });
  }
};
