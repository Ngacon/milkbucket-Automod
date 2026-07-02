const { parseDuration } = require('../../app/command-utils');
const { BOT_EMOJIS } = require('../../config/constants');
const { buildThresholdLines } = require('../../services/moderation/config-view');

const VALID_ACTIONS = new Set(['msg', 'timeout', 'kick', 'ban', 'jail']);

function formatDurationText(duration) {
  return duration == null ? '' : ` (${duration}s)`;
}

module.exports = {
  meta: {
    name: 'setwarn-deprecated',
    aliases: [],
    category: 'automod',
    permissions: ['ManageGuild'],
    ownerWhitelistOnly: true,
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: {
      min: 2,
      max: 80,
      usage: 'setwarn <count|window> <msg|timeout|kick|ban|jail> [time|message]'
    },
    examples: [
      'automod setwarn 3 timeout 300',
      'automod setwarn 5 jail',
      'automod setwarn 10 ban',
      'automod setwarn 1 msg Please stop breaking AutoMod rules',
      'automod setwarn window 600'
    ],
    descriptionKey: 'automod.descriptions.automodSetwarn',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond, colors, prefix }) {
    const [rawWarns, rawAction, rawDuration] = args;

    if (String(rawWarns).toLowerCase() === 'window') {
      const seconds = Number(rawAction);
      if (!Number.isInteger(seconds) || seconds <= 0) {
        await respond({
          color: colors.WARNING,
          description: `${BOT_EMOJIS.BROWTH.mention} ${t('common.errors.invalidCommandUsage', {
            usage: `${prefix}automod setwarn window 600`
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
    const needsTime = action === 'timeout' || action === 'mute';
    const duration = needsTime ? parseDuration(rawDuration) : null;
    const messageText = action === 'msg' ? args.slice(2).join(' ').trim() : null;

    if (
      !Number.isInteger(warns) ||
      warns <= 0 ||
      !VALID_ACTIONS.has(action) ||
      (action === 'msg' && !messageText) ||
      (needsTime && rawDuration == null) ||
      (needsTime && (!Number.isInteger(duration) || duration <= 0)) ||
      (action !== 'msg' && !needsTime && rawDuration != null)
    ) {
      await respond({
        color: colors.WARNING,
        description: `${BOT_EMOJIS.BROWTH.mention} ${t('common.errors.invalidCommandUsage', {
          usage: `${prefix}automod setwarn <count> <msg|timeout|mute|kick|ban|jail> [time|message]`
        })}`,
        thumbnail: BOT_EMOJIS.BROWTH.imageUrl
      });
      return;
    }

    const thresholds = await repos.automodRepo.upsertThreshold(
      message.guild.id,
      warns,
      action,
      duration,
      messageText || null
    );

    await respond({
      color: colors.SUCCESS,
      title: t('automod.responses.statusTitle'),
      description: t('automod.responses.thresholdUpdated', {
        warns,
        action: t(`automod.actions.${action}`),
        duration: formatDurationText(duration)
      }),
      thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl,
      fields: [
        {
          name: t('automod.labels.escalation'),
          value: buildThresholdLines({ thresholds }, t).join('\n'),
          inline: false
        }
      ]
    });
  }
};
