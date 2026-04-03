const { BOT_EMOJIS } = require('../../config/constants');
const {
  formatToggleState,
  buildActionLines,
  buildThresholdLines,
  countEnabledRules
} = require('../../services/moderation/config-view');

module.exports = {
  meta: {
    name: 'automod status',
    aliases: ['status automod'],
    category: 'automod',
    permissions: ['ManageGuild'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'automod status' },
    examples: ['automod status'],
    descriptionKey: 'automod.descriptions.automodStatus',
    guildOnly: true
  },
  async execute({ message, repos, t, respond, colors }) {
    const config = await repos.automodRepo.getConfig(message.guild.id);

    await respond({
      color: colors.PRIMARY,
      title: t('automod.responses.statusTitle'),
      description: t('automod.responses.statusDescription'),
      thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl,
      fields: [
        {
          name: t('automod.labels.systemState'),
          value: formatToggleState(config.enabled, t),
          inline: true
        },
        {
          name: t('automod.labels.rules'),
          value: `${countEnabledRules(config)}`,
          inline: true
        },
        {
          name: t('automod.labels.timeWindow'),
          value: `${config.timeWindow}s`,
          inline: true
        },
        {
          name: t('automod.labels.actions'),
          value: buildActionLines(config, t).join('\n'),
          inline: false
        },
        {
          name: t('automod.labels.escalation'),
          value: buildThresholdLines(config, t).join('\n'),
          inline: false
        },
        {
          name: t('automod.labels.modlog'),
          value: config.modlogChannelId
            ? `<#${config.modlogChannelId}>`
            : t('automod.responses.modlogMissing'),
          inline: false
        }
      ]
    });
  }
};
