const { parseDuration, formatDuration } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'remind',
    aliases: ['reminder'],
    category: 'utility',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 2, max: 20, usage: 'remind [time] [content]' },
    descriptionKey: 'utility.descriptions.remind',
    guildOnly: false
  },
  async execute({ message, args, t, respond }) {
    const duration = parseDuration(args.shift());
    const content = args.join(' ');
    if (!duration) {
      await respond({ description: t('common.responses.failure') });
      return;
    }

    await respond({
      description: t('utility.responses.reminderSet', {
        duration: formatDuration(duration)
      })
    });

    setTimeout(async () => {
      await message.channel.send(`${message.author} ${content}`);
    }, duration);
  }
};

