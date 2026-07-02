module.exports = {
  meta: {
    name: 'sync-perm',
    aliases: [],
    category: 'channels',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'sync-perm' },
    descriptionKey: 'channels.descriptions.syncPerm',
    guildOnly: true
  },
  async execute({ message, t, respond }) {
    if (!message.channel.parent) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    await message.channel.lockPermissions();
    await respond({
      description: t('channels.responses.channelSynced')
    });
  }
};

