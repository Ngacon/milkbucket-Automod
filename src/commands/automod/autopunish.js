const { BOT_EMOJIS } = require('../../config/constants');

const VALID_ACTIONS = new Set(['msg', 'timeout', 'mute', 'kick', 'ban']);
const STORED_ACTIONS = {
  msg: 'msg',
  timeout: 'timeout',
  mute: 'mute',
  kick: 'kick',
  ban: 'ban'
};

module.exports = {
  meta: {
    name: 'autopunish',
    aliases: ['automod autopunish'],
    category: 'automod',
    permissions: ['ManageGuild'],
    ownerWhitelistOnly: true,
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: {
      min: 2,
      max: 80,
      usage: 'autopunish <warns> <msg|timeout|mute|kick|ban> [time] [msg message]'
    },
    examples: [
      'autopunish 1 msg Please stop breaking AutoMod rules',
      'autopunish 3 mute 600',
      'autopunish 5 kick'
    ],
    descriptionKey: 'automod.descriptions.autopunish',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond, colors, prefix }) {
    const warns = Number(args[0]);
    const action = String(args[1] || '').toLowerCase();
    const rawTime = args[2];
    const needsTime = action === 'mute' || action === 'timeout';
    const duration = needsTime ? Number(rawTime) : null;
    const messageText =
      action === 'msg'
        ? args.slice(2).join(' ').trim()
        : args.slice(needsTime ? 3 : 2).join(' ').replace(/^msg\s+/i, '').trim();

    if (
      !Number.isInteger(warns) ||
      warns <= 0 ||
      !VALID_ACTIONS.has(action) ||
      (action === 'msg' && !messageText) ||
      (needsTime && (!Number.isInteger(duration) || duration <= 0))
    ) {
      await respond({
        color: colors.WARNING,
        description: `${BOT_EMOJIS.BROWTH.mention} ${t('common.errors.invalidCommandUsage', {
          usage: `${prefix}autopunish <warns> <msg|timeout|mute|kick|ban> [time] [msg message]`
        })}`,
        thumbnail: BOT_EMOJIS.BROWTH.imageUrl
      });
      return;
    }

    await repos.automodRepo.upsertThreshold(
      message.guild.id,
      warns,
      STORED_ACTIONS[action],
      duration,
      messageText || null
    );

    await respond({
      color: colors.SUCCESS,
      description:
        action === 'msg'
          ? `Auto punishment set: ${warns} warns -> DM message.`
          : `Auto punishment set: ${warns} warns -> ${action}${duration ? ` (${duration}s)` : ''}.`,
      thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl
    });
  }
};
