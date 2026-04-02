module.exports = {
  meta: {
    name: 'nuke',
    aliases: [],
    category: 'admin',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'nuke' },
    descriptionKey: 'admin.descriptions.nuke',
    guildOnly: true
  },
  async execute({ message, t }) {
    const channel = message.channel;
    const cloned = await channel.clone();
    await channel.delete();
    await cloned.send(t('admin.responses.nukeDone'));
  }
};

