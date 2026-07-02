const { parseDuration } = require('../../app/command-utils');
const { BOT_EMOJIS } = require('../../config/constants');

const VALID_ACTIONS = new Set(['msg', 'timeout', 'kick', 'ban', 'jail']);
const STORED_ACTIONS = {
  msg: 'msg',
  timeout: 'timeout',
  kick: 'kick',
  ban: 'ban',
  jail: 'jail'
};

module.exports = {
  meta: {
    name: 'autopunish',
    aliases: ['automod autopunish', 'automod setwarn', 'setwarn'],
    category: 'automod',
    permissions: ['ManageGuild'],
    ownerWhitelistOnly: true,
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: {
      min: 2,
      max: 80,
      usage: 'autopunish <warns> <msg|timeout|kick|ban|jail> [time] [msg message]'
    },
    examples: [
      'autopunish 1 msg Please stop breaking AutoMod rules',
      'autopunish 3 timeout 600',
      'autopunish 5 jail',
      'autopunish 5 kick'
    ],
    descriptionKey: 'automod.descriptions.autopunish',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond, colors, prefix }) {
    const [rawWarns, rawAction, ...restArgs] = args;

    if (String(rawWarns).toLowerCase() === 'window') {
      const seconds = Number(rawAction);
      if (!Number.isInteger(seconds) || seconds <= 0) {
        await respond({
          color: colors.WARNING,
          description: `${BOT_EMOJIS.BROWTH.mention} ${t('common.errors.invalidCommandUsage', {
            usage: `${prefix}autopunish window 600`
          })}`,
          thumbnail: BOT_EMOJIS.BROWTH.imageUrl
        });
        return;
      }

      await repos.automodRepo.setTimeWindow(message.guild.id, seconds);
      await respond({
        color: colors.SUCCESS,
        description: t('automod.responses.windowUpdated', {
          seconds
        }),
        thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl
      });
      return;
    }

    const warns = Number(rawWarns);
    const action = String(rawAction || '').toLowerCase();
    const rawTime = restArgs[0];
    const needsTime = action === 'timeout';
    const duration = needsTime ? parseDuration(rawTime) : null;
    const messageText =
      action === 'msg'
        ? restArgs.join(' ').trim()
        : restArgs.slice(needsTime ? 1 : 0).join(' ').replace(/^msg\s+/i, '').trim();

    if (
      !Number.isInteger(warns) ||
      warns <= 0 ||
      !VALID_ACTIONS.has(action) ||
      (action === 'msg' && !messageText) ||
      (needsTime && rawTime == null) ||
      (needsTime && (!Number.isInteger(duration) || duration <= 0))
    ) {
      await respond({
        color: colors.WARNING,
        description: `${BOT_EMOJIS.BROWTH.mention} ${t('common.errors.invalidCommandUsage', {
          usage: `${prefix}autopunish <warns> <msg|timeout|kick|ban|jail> [time] [msg message]`
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
