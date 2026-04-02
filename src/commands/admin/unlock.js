module.exports = {
  meta: {
    name: 'unlock',
    aliases: [],
    category: 'admin',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'unlock' },
    descriptionKey: 'admin.descriptions.unlock',
    guildOnly: true
  },
  async execute({ message, t, respond }) {
    if (!message.guild) {
      return;
    }

    const channels = message.guild.channels.cache.filter((channel) => channel.isTextBased());
    for (const channel of channels.values()) {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null
      });
    }

    await respond({
      description: t('admin.responses.lockdownDisabled')
    });
  }
};

