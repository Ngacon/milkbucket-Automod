const { resolveChannel } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'announce',
    aliases: [],
    category: 'utility',
    permissions: ['ManageMessages'],
    botPermissions: ['SendMessages'],
    cooldown: 2,
    args: { min: 2, max: 50, usage: 'announce #channel [content]' },
    examples: ['announce #general Server sẽ bảo trì lúc 10h'],
    descriptionKey: 'utility.descriptions.announce',
    guildOnly: true
  },
  async execute({ message, args, respond, t }) {
    const channelArg = args.shift();
    const channel = resolveChannel(message, channelArg);
    const content = args.join(' ').trim();

    if (!channel || !channel.isTextBased() || !content) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    await channel.send({
      content
    });

    await respond({
      description: t('utility.responses.announceSent', {
        channel: `#${channel.name}`
      })
    });
  }
};
