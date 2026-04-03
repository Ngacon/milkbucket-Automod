const { BOT_EMOJIS } = require('../../config/constants');
const { buildRuleLines } = require('../../services/moderation/config-view');

module.exports = {
  meta: {
    name: 'automod list',
    aliases: ['list automod'],
    category: 'automod',
    permissions: ['ManageGuild'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'automod list' },
    examples: ['automod list'],
    descriptionKey: 'automod.descriptions.automodList',
    guildOnly: true
  },
  async execute({ message, repos, t, respond, colors }) {
    const config = await repos.automodRepo.getConfig(message.guild.id);

    await respond({
      color: colors.PRIMARY,
      title: t('automod.responses.listTitle'),
      description: t('automod.responses.listDescription'),
      thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl,
      fields: [
        {
          name: t('automod.labels.rules'),
          value: buildRuleLines(config, t).join('\n'),
          inline: false
        }
      ]
    });
  }
};
