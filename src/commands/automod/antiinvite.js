module.exports = {
  meta: {
    name: 'antiinvite',
    aliases: [],
    category: 'automod',
    permissions: ['ManageGuild'],
    ownerWhitelistOnly: true,
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'antiinvite on|off' },
    descriptionKey: 'automod.descriptions.antiinvite',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const enabled = args[0]?.toLowerCase() === 'on';
    await repos.automodRepo.setToggle(message.guild.id, 'antiinvite', enabled);
    await respond({
      description: t('automod.responses.toggled', {
        feature: t('automod.features.antiinvite'),
        state: t(enabled ? 'common.labels.on' : 'common.labels.off')
      })
    });
  }
};

