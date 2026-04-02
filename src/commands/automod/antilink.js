module.exports = {
  meta: {
    name: 'antilink',
    aliases: [],
    category: 'automod',
    permissions: ['ManageGuild'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'antilink on|off' },
    descriptionKey: 'automod.descriptions.antilink',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const enabled = args[0]?.toLowerCase() === 'on';
    await repos.automodRepo.setToggle(message.guild.id, 'antilink', enabled);
    await respond({
      description: t('automod.responses.toggled', {
        feature: t('automod.features.antilink'),
        state: t(enabled ? 'common.labels.on' : 'common.labels.off')
      })
    });
  }
};

