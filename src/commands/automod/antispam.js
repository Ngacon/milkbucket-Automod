module.exports = {
  meta: {
    name: 'antispam',
    aliases: [],
    category: 'automod',
    permissions: ['ManageGuild'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'antispam on|off' },
    descriptionKey: 'automod.descriptions.antispam',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const enabled = args[0]?.toLowerCase() === 'on';
    await repos.automodRepo.setToggle(message.guild.id, 'antispam', enabled);
    await respond({
      description: t('automod.responses.toggled', {
        feature: t('automod.features.antispam'),
        state: t(enabled ? 'common.labels.on' : 'common.labels.off')
      })
    });
  }
};

