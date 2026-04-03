const { BOT_EMOJIS } = require('../../config/constants');
const { hasAutomodOwnerAccess } = require('../../app/guards');
const {
  formatToggleState,
  buildActionLines,
  countEnabledRules
} = require('../../services/moderation/config-view');

module.exports = {
  meta: {
    name: 'automod',
    aliases: [],
    category: 'automod',
    permissions: ['ManageGuild'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 0, max: 1, usage: 'automod [enable|disable]' },
    examples: ['automod', 'automod enable', 'automod disable', 'automod status'],
    descriptionKey: 'automod.descriptions.automod',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond, colors, prefix }) {
    const state = args[0]?.toLowerCase();

    if (!state) {
      const config = await repos.automodRepo.getConfig(message.guild.id);
      await respond({
        color: colors.PRIMARY,
        title: t('automod.responses.statusTitle'),
        description: t('automod.responses.dashboardSummary', {
          state: formatToggleState(config.enabled, t),
          rules: countEnabledRules(config)
        }),
        thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl,
        fields: [
          {
            name: t('automod.labels.systemState'),
            value: formatToggleState(config.enabled, t),
            inline: true
          },
          {
            name: t('automod.labels.actions'),
            value: buildActionLines(config, t).join('\n'),
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
      return;
    }

    if (!['enable', 'disable', 'on', 'off'].includes(state)) {
      await respond({
        color: colors.WARNING,
        description: `${BOT_EMOJIS.BROWTH.mention} ${t('common.errors.invalidCommandUsage', {
          usage: `${prefix}automod [enable|disable]`
        })}`,
        thumbnail: BOT_EMOJIS.BROWTH.imageUrl
      });
      return;
    }

    if (!hasAutomodOwnerAccess(message)) {
      await respond({
        color: colors.ERROR,
        description: `${BOT_EMOJIS.USER_PERMISSIONS.mention} ${t('common.errors.ownerWhitelistOnly')}`,
        thumbnail: BOT_EMOJIS.USER_PERMISSIONS.imageUrl
      });
      return;
    }

    const enabled = state === 'enable' || state === 'on';
    await repos.automodRepo.setToggle(message.guild.id, 'enabled', enabled);
    const config = await repos.automodRepo.getConfig(message.guild.id);

    await respond({
      color: enabled ? colors.SUCCESS : colors.WARNING,
      thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl,
      description: t('automod.responses.toggled', {
        feature: t('automod.features.automod'),
        state: t(enabled ? 'common.labels.on' : 'common.labels.off')
      }),
      fields: [
        {
          name: t('automod.labels.rules'),
          value: `${countEnabledRules(config)}`,
          inline: true
        },
        {
          name: t('automod.labels.actions'),
          value: buildActionLines(config, t).join('\n'),
          inline: false
        }
      ]
    });
  }
};

