const { buildEmbed } = require('../../app/embeds');
const { BOT_EMOJIS, EMBED_COLORS, DEFAULT_LOCALE } = require('../../config/constants');
const { resolveEscalationRule, buildEscalationKey } = require('./escalation');
const { sendModerationLog } = require('./modlog');

const deleteMessage = require('./actions/delete-message');
const warn = require('./actions/warn');
const timeoutMember = require('./actions/timeout');
const muteMember = require('./actions/mute');
const kickMember = require('./actions/kick');
const banMember = require('./actions/ban');
const slowmode = require('./actions/slowmode');
const deleteWebhooks = require('./actions/delete-webhooks');

const selfbotDetector = require('./detectors/selfbot');
const webhookSpamDetector = require('./detectors/webhook-spam');
const botAddDetector = require('./detectors/bot-add');
const spamDetector = require('./detectors/spam');
const duplicateDetector = require('./detectors/duplicate');
const inviteDetector = require('./detectors/invite');
const linkDetector = require('./detectors/link');
const mentionDetector = require('./detectors/mention');
const capsDetector = require('./detectors/caps');
const badwordsDetector = require('./detectors/badwords');

function buildDetectors() {
  return [
    selfbotDetector,
    webhookSpamDetector,
    botAddDetector,
    spamDetector,
    duplicateDetector,
    inviteDetector,
    linkDetector,
    mentionDetector,
    capsDetector,
    badwordsDetector
  ];
}

function createModerationService({ client, i18n, redis, repos, logger }) {
  const detectors = buildDetectors();

  async function buildContext(payload) {
    const guild = payload.guild || payload.message?.guild || payload.member?.guild || null;
    if (!guild) {
      return null;
    }

    const [guildSettings, config] = await Promise.all([
      repos.guildSettingsRepo
        ? repos.guildSettingsRepo.getSettings(guild.id)
        : { locale: DEFAULT_LOCALE },
      repos.automodRepo.getConfig(guild.id)
    ]);

    const locale = guildSettings?.locale || DEFAULT_LOCALE;
    let wordsCache = null;

    return {
      ...payload,
      client,
      guild,
      config,
      locale,
      redis,
      repos,
      logger,
      t: (key, params) => i18n.t(locale, key, params),
      getBadwords: async () => {
        if (!wordsCache) {
          wordsCache = await repos.automodRepo.listWords(guild.id);
        }
        return wordsCache;
      }
    };
  }

  async function runDetectors(ctx) {
    for (const detector of detectors) {
      const result = await detector.check(ctx);

      if (!result?.triggered) {
        continue;
      }

      return {
        type: detector.name,
        category: detector.type,
        severity: result.severity || 1,
        reason: result.reason,
        flags: {
          autowarn: Boolean(result.flags?.autowarn),
          delete: Boolean(result.flags?.delete),
          escalate: Boolean(result.flags?.escalate),
          instantBan: Boolean(result.flags?.instantBan),
          slowmode: Boolean(result.flags?.slowmode),
          deleteWebhooks: Boolean(result.flags?.deleteWebhooks),
          kick: Boolean(result.flags?.kick)
        },
        meta: result.meta || {}
      };
    }

    return null;
  }

  async function notifyChannel(ctx, violation) {
    if (ctx.kind !== 'message' || !ctx.message?.channel?.isTextBased()) {
      return;
    }

    try {
      const warningMessage = await ctx.message.channel.send({
        embeds: [
          buildEmbed({
            color: EMBED_COLORS.WARNING,
            description: `${BOT_EMOJIS.AUTOMOD.mention} ${ctx.t(`automod.violations.${violation.type}`, violation.meta)}`,
            thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl
          })
        ]
      });

      setTimeout(() => {
        warningMessage.delete().catch(() => null);
      }, 5000);
    } catch (error) {
      logger.warn('Failed to notify automod violation in channel', {
        error,
        guildId: ctx.guild.id,
        channelId: ctx.message.channelId
      });
    }
  }

  async function applyEscalation(ctx, violation, warnResult) {
    if (!warnResult || !violation.flags.escalate) {
      return null;
    }

    const rule = resolveEscalationRule({
      warnCount: warnResult.warnCount,
      thresholds: ctx.config.thresholds
    });

    if (!rule) {
      return null;
    }

    const dedupeKey = buildEscalationKey(ctx.guild.id, ctx.user.id, rule.warns);
    const alreadyApplied = await ctx.redis.get(dedupeKey);
    if (alreadyApplied) {
      return null;
    }

    const payload = {
      reason: `${violation.reason} (warn threshold ${rule.warns})`,
      duration: rule.duration
    };

    let applied = false;
    if (rule.action === 'timeout') {
      applied = await timeoutMember(ctx, payload);
    } else if (rule.action === 'mute') {
      applied = await muteMember(ctx, payload);
    } else if (rule.action === 'kick') {
      applied = await kickMember(ctx, payload);
    } else if (rule.action === 'ban') {
      applied = await banMember(ctx, payload);
    }

    if (!applied) {
      return null;
    }

    await ctx.redis.set(dedupeKey, rule.action, 'EX', ctx.config.timeWindow);
    return {
      action: rule.action,
      duration: rule.duration
    };
  }

  async function sendModlog(ctx, violation, details = {}) {
    const actionLabel = details.finalAction || 'warn';
    const userLabel = ctx.user ? `${ctx.user.tag} (${ctx.user.id})` : ctx.member?.id || 'unknown';

    await sendModerationLog({
      guild: ctx.guild,
      repos: ctx.repos,
      channelId: ctx.config.modlogChannelId,
      color: violation.category === 'raid' ? EMBED_COLORS.ERROR : EMBED_COLORS.WARNING,
      title: `${violation.category.toUpperCase()} • ${violation.type}`,
      description: violation.reason,
      thumbnail:
        violation.category === 'raid'
          ? BOT_EMOJIS.HIERARCHY.imageUrl
          : BOT_EMOJIS.AUTOMOD.imageUrl,
      fields: [
        {
          name: ctx.t('moderation.labels.user'),
          value: userLabel,
          inline: false
        },
        {
          name: ctx.t('moderation.labels.warnCount'),
          value: `${details.warnCount || 0}`,
          inline: true
        },
        {
          name: ctx.t('moderation.labels.action'),
          value: actionLabel,
          inline: true
        },
        {
          name: ctx.t('moderation.labels.reason'),
          value: violation.reason,
          inline: false
        }
      ]
    });
  }

  async function processViolation(ctx, violation) {
    let finalAction = 'none';
    let warnResult = null;

    if (violation.flags.delete) {
      await deleteMessage(ctx);
      finalAction = 'delete-message';
    }

    if (violation.flags.deleteWebhooks) {
      const deleted = await deleteWebhooks(ctx);
      if (deleted) {
        finalAction = 'delete-webhooks';
      }
    }

    if (violation.flags.slowmode) {
      const slowed = await slowmode(ctx, {
        seconds: violation.meta.slowmodeSeconds || 15
      });

      if (slowed) {
        finalAction = 'slowmode';
      }
    }

    if (violation.flags.kick) {
      const kicked = await kickMember(ctx, {
        reason: violation.reason
      });

      if (kicked) {
        finalAction = 'kick';
      }
    }

    if (violation.flags.autowarn && ctx.config.actions.autowarn && ctx.user && !ctx.user.bot) {
      warnResult = await warn(ctx, {
        reason: violation.reason,
        source: violation.type
      });
      finalAction = 'warn';
    }

    if (violation.flags.instantBan) {
      const banned = await banMember(ctx, {
        reason: violation.reason
      });

      if (banned) {
        finalAction = 'ban';
      }
    } else {
      const escalationResult = await applyEscalation(ctx, violation, warnResult);
      if (escalationResult?.action) {
        finalAction = escalationResult.action;
      }
    }

    await notifyChannel(ctx, violation);
    await sendModlog(ctx, violation, {
      finalAction,
      warnCount: warnResult?.warnCount || 0
    });

    return {
      ...violation,
      finalAction,
      warnCount: warnResult?.warnCount || 0
    };
  }

  async function handleMessage(message) {
    const ctx = await buildContext({
      kind: 'message',
      message,
      guild: message.guild,
      member: message.member,
      user: message.author
    });

    if (!ctx?.config?.enabled) {
      return null;
    }

    const violation = await runDetectors(ctx);
    if (!violation) {
      return null;
    }

    return processViolation(ctx, violation);
  }

  async function handleGuildMemberAdd(member) {
    const ctx = await buildContext({
      kind: 'memberAdd',
      member,
      guild: member.guild,
      user: member.user
    });

    if (!ctx?.config?.enabled) {
      return null;
    }

    const violation = await runDetectors(ctx);
    if (!violation) {
      return null;
    }

    return processViolation(ctx, violation);
  }

  return {
    handleMessage,
    handleGuildMemberAdd
  };
}

module.exports = {
  createModerationService
};
