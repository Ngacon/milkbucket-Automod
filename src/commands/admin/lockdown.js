const { parseDuration } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'lockdown',
    aliases: [],
    category: 'admin',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 0, max: 1, usage: 'lockdown [time]' },
    descriptionKey: 'admin.descriptions.lockdown',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    if (!message.guild) {
      return;
    }

    const duration = parseDuration(args[0]);
    const channels = message.guild.channels.cache.filter((channel) => channel.isTextBased());

    for (const channel of channels.values()) {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false
      });
    }

    if (duration) {
      setTimeout(async () => {
        for (const channel of channels.values()) {
          await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: null
          });
        }
      }, duration);
    }

    await respond({
      description: t('admin.responses.lockdownEnabled')
    });
  }
};

