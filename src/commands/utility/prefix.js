const { validatePrefix } = require('../../app/validators');

module.exports = {
  meta: {
    name: 'prefix',
    aliases: [],
    category: 'utility',
    permissions: ['ManageGuild'],
    botPermissions: [],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'prefix [newPrefix]' },
    descriptionKey: 'utility.descriptions.prefix',
    guildOnly: true
  },
  async execute({ message, args, guildSettingsRepo, t, respond }) {
    const desiredPrefix = args[0];
    const validation = validatePrefix(desiredPrefix);
    if (!validation.valid) {
      await respond({
        description: t(validation.key, validation.params)
      });
      return;
    }

    await guildSettingsRepo.setPrefix(message.guild.id, validation.value);
    await respond({
      description: t('utility.responses.prefixSet', { prefix: validation.value })
    });
  }
};

