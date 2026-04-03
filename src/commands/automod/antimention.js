module.exports = {
  meta: {
    name: 'antimention',
    aliases: [],
    category: 'automod',
    permissions: ['ManageGuild'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'antimention [max]' },
    examples: ['antimention 5', 'antimention 0'],
    descriptionKey: 'automod.descriptions.antimention',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const maxMentions = Math.max(0, Number(args[0] || 0));
    if (Number.isNaN(maxMentions)) {
      await respond({
        description: t('automod.responses.toggled', {
          feature: t('automod.features.antimention'),
          state: t('common.labels.off')
        })
      });
      return;
    }

    await repos.automodRepo.setAntiMention(message.guild.id, maxMentions);
    await respond({
      description: t('automod.responses.mentionLimitUpdated', {
        max: maxMentions
      })
    });
  }
};

