module.exports = {
  meta: {
    name: 'listwords',
    aliases: [],
    category: 'automod',
    permissions: ['ManageGuild'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'listwords' },
    descriptionKey: 'automod.descriptions.listwords',
    guildOnly: true
  },
  async execute({ message, repos, t, respond }) {
    const words = await repos.automodRepo.listWords(message.guild.id);
    if (words.length === 0) {
      await respond({
        description: t('automod.responses.wordsEmpty')
      });
      return;
    }

    await respond({
      description: t('automod.responses.wordsList', {
        words: words.join(', ')
      })
    });
  }
};

