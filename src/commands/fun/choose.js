module.exports = {
  meta: {
    name: 'choose',
    aliases: [],
    category: 'fun',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 1, max: 20, usage: 'choose [opt1], [opt2]' },
    descriptionKey: 'fun.descriptions.choose',
    guildOnly: false
  },
  async execute({ args, t, respond }) {
    const content = args.join(' ');
    const options = content.split(',').map((item) => item.trim()).filter(Boolean);
    if (options.length === 0) {
      await respond({ description: t('common.responses.failure') });
      return;
    }

    const choice = options[Math.floor(Math.random() * options.length)];
    await respond({
      description: t('fun.responses.choose', { choice })
    });
  }
};

