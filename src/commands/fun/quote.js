module.exports = {
  meta: {
    name: 'quote',
    aliases: [],
    category: 'fun',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'quote' },
    descriptionKey: 'fun.descriptions.quote',
    guildOnly: false
  },
  async execute({ t, respond }) {
    const quotes = [
      'Gio la luc bat dau.',
      'Lam nho, lam nhanh, lam deu.',
      'Thay doi bat dau tu nhung viec nho.'
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    await respond({
      description: t('fun.responses.quote', { quote })
    });
  }
};

