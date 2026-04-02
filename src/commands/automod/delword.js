module.exports = {
  meta: {
    name: 'delword',
    aliases: [],
    category: 'automod',
    permissions: ['ManageGuild'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'delword [word]' },
    descriptionKey: 'automod.descriptions.delword',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const word = args[0]?.toLowerCase();
    if (!word) {
      await respond({
        description: t('automod.responses.wordsEmpty')
      });
      return;
    }

    await repos.automodRepo.removeWord(message.guild.id, word);
    await respond({
      description: t('automod.responses.wordRemoved', { word })
    });
  }
};

