module.exports = {
  meta: {
    name: 'addword',
    aliases: [],
    category: 'automod',
    permissions: ['ManageGuild'],
    ownerWhitelistOnly: true,
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'addword [word]' },
    descriptionKey: 'automod.descriptions.addword',
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

    await repos.automodRepo.addWord(message.guild.id, word);
    await repos.automodRepo.setToggle(message.guild.id, 'badwords', true);
    await respond({
      description: t('automod.responses.wordAdded', { word })
    });
  }
};

