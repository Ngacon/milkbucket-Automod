const { BOT_EMOJIS } = require('../../config/constants');
const { hasAutomodOwnerAccess } = require('../../app/guards');

function resolveChannelId(raw) {
  return String(raw || '').replace(/[<#>]/g, '');
}

function isSnowflake(value) {
  return /^\d{17,20}$/.test(String(value || ''));
}

module.exports = {
  meta: {
    name: 'antispamchannel',
    aliases: ['antispamch', 'spamchannel', 'spamch'],
    category: 'automod',
    permissions: ['ManageGuild'],
    ownerWhitelistOnly: true,
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: {
      min: 1,
      max: 3,
      usage: 'antispamchannel <add|remove|list> [channel]'
    },
    examples: [
      'antispamchannel add #spam-channel',
      'antispamchannel remove 123456789012345678',
      'antispamchannel list'
    ],
    descriptionKey: 'automod.descriptions.antispamchannel',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond, colors, prefix }) {
    if (!hasAutomodOwnerAccess(message)) {
      await respond({
        color: colors.ERROR,
        description: `${BOT_EMOJIS.USER_PERMISSIONS.mention} ${t('common.errors.ownerWhitelistOnly')}`,
        thumbnail: BOT_EMOJIS.USER_PERMISSIONS.imageUrl
      });
      return;
    }

    const action = String(args[0] || '').toLowerCase();
    const channelId = resolveChannelId(args[1]);

    if (!['add', 'remove', 'list'].includes(action)) {
      await respond({
        color: colors.WARNING,
        description: `${BOT_EMOJIS.BROWTH.mention} ${t('common.errors.invalidCommandUsage', {
          usage: `${prefix}antispamchannel <add|remove|list> [channel]`
        })}`,
        thumbnail: BOT_EMOJIS.BROWTH.imageUrl
      });
      return;
    }

    const config = await repos.automodRepo.getConfig(message.guild.id);
    let allowedChannels = config.spamAllowedChannelIds || [];

    if (action === 'list') {
      await respond({
        color: colors.PRIMARY,
        title: t('automod.responses.statusTitle'),
        description: allowedChannels.length
          ? allowedChannels.map((id) => `<#${id}>`).join('\n')
          : t('automod.responses.wordsEmpty'),
        thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl
      });
      return;
    }

    if (!isSnowflake(channelId)) {
      await respond({
        color: colors.WARNING,
        description: `${BOT_EMOJIS.BROWTH.mention} ${t('automod.errors.invalidChannel')}`,
        thumbnail: BOT_EMOJIS.BROWTH.imageUrl
      });
      return;
    }

    if (action === 'add') {
      if (allowedChannels.includes(channelId)) {
        await respond({
          color: colors.WARNING,
          description: `<#${channelId}> ${t('automod.errors.alreadyWhitelisted')}`,
          thumbnail: BOT_EMOJIS.BROWTH.imageUrl
        });
        return;
      }

      allowedChannels.push(channelId);
      await repos.automodRepo.setSpamAllowedChannelIds(message.guild.id, allowedChannels);

      await respond({
        color: colors.SUCCESS,
        description: `<#${channelId}> ${t('automod.responses.added', { feature: t('automod.features.antispam') })}`,
        thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl
      });
      return;
    }

    if (action === 'remove') {
      if (!allowedChannels.includes(channelId)) {
        await respond({
          color: colors.WARNING,
          description: `<#${channelId}> ${t('automod.errors.notWhitelisted')}`,
          thumbnail: BOT_EMOJIS.BROWTH.imageUrl
        });
        return;
      }

      allowedChannels = allowedChannels.filter((id) => id !== channelId);
      await repos.automodRepo.setSpamAllowedChannelIds(message.guild.id, allowedChannels);

      await respond({
        color: colors.WARNING,
        description: `<#${channelId}> ${t('automod.responses.removed', { feature: t('automod.features.antispam') })}`,
        thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl
      });
    }
  }
};