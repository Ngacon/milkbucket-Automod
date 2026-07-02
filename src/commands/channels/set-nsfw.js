module.exports = {
  meta: {
    name: 'set-nsfw',
    aliases: ['set nsfw', 'set_nsfw'],
    category: 'channels',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'set-nsfw' },
    examples: ['set-nsfw'],
    descriptionKey: 'channels.descriptions.setNsfw',
    guildOnly: true
  },
  async execute({ message, respond, t }) {
    if (typeof message.channel.setNSFW !== 'function') {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const nextState = !message.channel.nsfw;
    await message.channel.setNSFW(nextState);

    await respond({
      description: t(
        nextState ? 'channels.responses.nsfwEnabled' : 'channels.responses.nsfwDisabled',
        {
          channel: message.channel.name
        }
      )
    });
  }
};
