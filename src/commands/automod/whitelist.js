const { BOT_EMOJIS } = require('../../config/constants');
const { hasAutomodOwnerAccess } = require('../../app/guards');

function resolveUserId(raw) {
  return String(raw || '').replace(/[<@!>]/g, '');
}

function isSnowflake(value) {
  return /^\d{17,20}$/.test(String(value || ''));
}

module.exports = {
  meta: {
    name: 'automod whitelist',
    aliases: ['whitelist'],
    category: 'automod',
    permissions: ['ManageGuild'],
    ownerWhitelistOnly: true,
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: {
      min: 1,
      max: 2,
      usage: 'automod whitelist <add|remove|list> [user]'
    },
    examples: [
      'automod whitelist add @user',
      'automod whitelist remove 123456789',
      'automod whitelist list'
    ],
    descriptionKey: 'automod.descriptions.whitelist',
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
    const userId = resolveUserId(args[1]);

    if (
      !['add', 'remove', 'list'].includes(action) ||
      (action !== 'list' && !isSnowflake(userId))
    ) {
      await respond({
        color: colors.WARNING,
        description: `${BOT_EMOJIS.BROWTH.mention} ${t('common.errors.invalidCommandUsage', {
          usage: `${prefix}automod whitelist <add|remove|list> [user]`
        })}`,
        thumbnail: BOT_EMOJIS.BROWTH.imageUrl
      });
      return;
    }

    if (action === 'list') {
      const rows = await repos.automodRepo.listWhitelist(message.guild.id);
      await respond({
        color: colors.PRIMARY,
        title: 'AutoMod Whitelist',
        description: rows.length
          ? rows.map((row) => `<@${row.user_id}>`).join('\n')
          : 'No users are whitelisted.',
        thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl
      });
      return;
    }

    if (action === 'add') {
      await repos.automodRepo.addWhitelist(message.guild.id, userId, message.author.id);
      await respond({
        color: colors.SUCCESS,
        description: `<@${userId}> is now whitelisted for AutoMod and protected commands.`,
        thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl
      });
      return;
    }

    await repos.automodRepo.removeWhitelist(message.guild.id, userId);
    await respond({
      color: colors.WARNING,
      description: `<@${userId}> was removed from the AutoMod whitelist.`,
      thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl
    });
  }
};
