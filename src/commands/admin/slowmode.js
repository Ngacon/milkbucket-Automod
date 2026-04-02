module.exports = {
  meta: {
    name: 'slowmode',
    aliases: [],
    category: 'admin',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'slowmode [seconds]' },
    descriptionKey: 'admin.descriptions.slowmode',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const seconds = Math.max(0, Math.min(Number(args[0] || 0), 21600));
    if (Number.isNaN(seconds)) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    await message.channel.setRateLimitPerUser(seconds);
    await respond({
      description: t('admin.responses.slowmodeSet', { seconds })
    });
  }
};

