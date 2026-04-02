module.exports = {
  meta: {
    name: 'automod',
    aliases: [],
    category: 'automod',
    permissions: ['ManageGuild'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'automod enable|disable' },
    descriptionKey: 'automod.descriptions.automod',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const state = args[0]?.toLowerCase();
    const enabled = state === 'enable' || state === 'on';
    await repos.automodRepo.setToggle(message.guild.id, 'enabled', enabled);

    await respond({
      description: t('automod.responses.toggled', {
        feature: t('automod.features.automod'),
        state: t(enabled ? 'common.labels.on' : 'common.labels.off')
      })
    });
  }
};

