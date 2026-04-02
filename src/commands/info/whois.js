const { resolveUser } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'whois',
    aliases: [],
    category: 'info',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'whois [id]' },
    examples: ['whois 123456789012345678'],
    descriptionKey: 'info.descriptions.whois',
    guildOnly: false
  },
  async execute({ client, args, respond, t }) {
    const user = await resolveUser(client, args[0]);

    if (!user) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    await respond({
      title: user.tag,
      thumbnail: user.displayAvatarURL({ size: 256 }),
      description: t('info.responses.whoisSummary', {
        user: user.toString()
      }),
      fields: [
        {
          name: t('common.labels.id'),
          value: user.id,
          inline: true
        },
        {
          name: t('common.labels.created'),
          value: user.createdAt.toISOString(),
          inline: true
        }
      ]
    });
  }
};
