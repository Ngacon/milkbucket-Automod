const { BOT_EMOJIS } = require('../../config/constants');
const { buildThresholdLines } = require('../../services/moderation/config-view');

const VALID_ACTIONS = new Set(['timeout', 'mute', 'kick', 'ban']);

function formatDurationText(duration) {
  return duration == null ? '' : ` (${duration}s)`;
}

module.exports = {
  meta: {
    name: 'automod setwarn',
    aliases: ['setwarn'],
    category: 'automod',
    permissions: ['ManageGuild'],
    ownerWhitelistOnly: true,
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: {
      min: 2,
      max: 3,
      usage: 'automod setwarn <count|window> <action|seconds> [duration]'
    },
    examples: [
      'automod setwarn 3 timeout 300',
      'automod setwarn 5 mute',
      'automod setwarn 10 ban',
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
    const duration = rawDuration == null ? null : Number(rawDuration);

    if (
      !Number.isInteger(warns) ||
      warns <= 0 ||
      !VALID_ACTIONS.has(action) ||
      (action === 'timeout' && rawDuration == null) ||
      (rawDuration != null && (!Number.isInteger(duration) || duration <= 0))
    ) {
      await respond({
        color: colors.WARNING,
        description: `${BOT_EMOJIS.BROWTH.mention} ${t('common.errors.invalidCommandUsage', {
          usage: `${prefix}automod setwarn <count> <timeout|mute|kick|ban> [duration]`
        })}`,
        thumbnail: BOT_EMOJIS.BROWTH.imageUrl
      });
      return;
    }

    const thresholds = await repos.automodRepo.upsertThreshold(
      message.guild.id,
      warns,
      action,
      duration
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
