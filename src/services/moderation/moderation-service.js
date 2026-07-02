const { buildEmbed } = require('../../app/embeds');
const { PermissionFlagsBits } = require('discord.js');
const {
  BOT_EMOJIS,
  EMBED_COLORS,
  DEFAULT_LOCALE,
  BOT_OWNER_IDS,
  AUTOMOD_PROTECTED_CHANNEL_ID,
  AUTOMOD_SPAM_ALLOWED_CHANNEL_ID,
  JAIL_ROLE_ID
} = require('../../config/constants');
const { resolveEscalationRule, buildEscalationKey } = require('./escalation');
const { sendModerationLog } = require('./modlog');

const deleteMessage = require('./actions/delete-message');
const warn = require('./actions/warn');
const timeoutMember = require('./actions/timeout');
const muteMember = require('./actions/mute');
const kickMember = require('./actions/kick');
const banMember = require('./actions/ban');
const jailMember = require('./actions/jail');
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

const DANGEROUS_PERMISSIONS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ModerateMembers
];

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

function truncate(value, maxLength = 900) {
  const text = String(value || '').trim();
  if (!text) {
    return 'none';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

function formatDuration(seconds) {
  if (seconds == null) {
    return 'none';
  }

  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) {
    return 'none';
  }

  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  if (minutes > 0 && remainder > 0) {
    return `${minutes}m ${remainder}s`;
  }

  return minutes > 0 ? `${minutes}m` : `${remainder}s`;
}

function formatMeta(meta = {}) {
  const entries = Object.entries(meta).filter(([, value]) => value != null && value !== '');
  if (entries.length === 0) {
    return 'none';
  }

  return entries
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');
}

function buildMessageJumpUrl(message) {
  if (!message?.guildId || !message?.channelId || !message?.id) {
    return null;
  }

  return `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
}

function createSafeRedis(redis, logger) {
  if (!redis) {
    return {
      get: async () => null,
      set: async () => null,
      incr: async () => 0,
      expire: async () => null
    };
  }

  async function safeCall(method, fallback, args) {
    try {
      return await redis[method](...args);
    } catch (error) {
      logger.warn('Redis moderation operation failed', {
        error,
        operation: method
      });
      return fallback;
    }
  }

  return {
    get: (...args) => safeCall('get', null, args),
    set: (...args) => safeCall('set', null, args),
    incr: (...args) => safeCall('incr', 0, args),
    expire: (...args) => safeCall('expire', null, args)
  };
}

function createModerationService({ client, i18n, redis, repos, logger }) {
  const detectors = buildDetectors();
  const moderationRedis = createSafeRedis(redis, logger);

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
      redis: moderationRedis,
      repos,
      logger,
      isWhitelisted: async (userId) =>
        repos.automodRepo.isWhitelisted(guild.id, userId),
      isPrivilegedAutomodUser: async (userId) => {
        const normalizedUserId = String(userId || '');
        return (
          normalizedUserId === guild.ownerId ||
          BOT_OWNER_IDS.includes(normalizedUserId) ||
          (await repos.automodRepo.isWhitelisted(guild.id, normalizedUserId))
        );
      },
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

  async function revokeInviterAdmin(ctx) {
    if (ctx.kind !== 'memberAdd' || !ctx.member?.user?.bot) {
      return null;
    }

    const executorId = ctx.violation?.meta?.inviterId;
    if (!executorId || (await ctx.isPrivilegedAutomodUser(executorId))) {
      return executorId || null;
    }

    const inviter = await ctx.guild.members.fetch(executorId).catch(() => null);
    if (!inviter) {
      return {
        userId: executorId,
        roleIds: []
      };
    }

    const dangerousRoles = inviter.roles.cache.filter((role) => {
      if (role.managed || role.id === ctx.guild.id || !role.editable) {
        return false;
      }
      return DANGEROUS_PERMISSIONS.some((permission) => role.permissions.has(permission));
    });

    const roleIds = dangerousRoles.map((role) => role.id);

    if (roleIds.length > 0) {
      await inviter.roles.remove(
        roleIds,
        'AutoMod anti-bot: revoked admin/mod roles from bot inviter'
      ).catch((error) => {
        logger.warn('Failed to remove dangerous roles from bot inviter', {
          error,
          guildId: ctx.guild.id,
          inviterId: executorId,
          roleIds
        });
      });
    }

    return {
      userId: executorId,
      roleIds
    };
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
    if (rule.action === 'msg') {
      await ctx.user.send(rule.message || payload.reason).catch(() => null);
      applied = true;
    } else if (rule.action === 'timeout') {
      applied = await runModerationAction(ctx, 'timeout', () => timeoutMember(ctx, payload));
    } else if (rule.action === 'mute') {
      applied = await runModerationAction(ctx, 'mute', () => muteMember(ctx, payload));
    } else if (rule.action === 'kick') {
      applied = await runModerationAction(ctx, 'kick', () => kickMember(ctx, payload));
    } else if (rule.action === 'ban') {
      applied = await runModerationAction(ctx, 'ban', () => banMember(ctx, payload));
    } else if (rule.action === 'jail') {
      applied = await runModerationAction(ctx, 'jail', () => jailMember(ctx, payload));
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

  async function runModerationAction(ctx, action, callback) {
    try {
      return Boolean(await callback());
    } catch (error) {
      logger.warn('Moderation action failed', {
        error,
        action,
        guildId: ctx.guild?.id || null,
        userId: ctx.user?.id || ctx.member?.id || null
      });
      return false;
    }
  }

  async function sendModlog(ctx, violation, details = {}) {
    const actionLabel = details.finalAction || 'warn';
    const userLabel = ctx.user
      ? `${ctx.user.tag} (${ctx.user.id})`
      : ctx.member?.id || 'unknown';
    const channelLabel = ctx.message?.channel
      ? `${ctx.message.channel.toString()} (${ctx.message.channelId})`
      : 'member join event';
    const jumpUrl = buildMessageJumpUrl(ctx.message);
    const content = ctx.message?.content
      ? truncate(ctx.message.content)
      : ctx.member?.user?.bot
        ? `Bot joined: ${ctx.member.user.tag} (${ctx.member.id})`
        : 'none';
    const titlePrefix = violation.category === 'raid' ? 'SECURITY ALERT' : 'AUTOMOD HIT';
    const metadata = {
      ...violation.meta,
      revokedUserId: details.revoked?.userId,
      revokedRoleIds: details.revoked?.roleIds?.length
        ? details.revoked.roleIds.join(', ')
        : null
    };

    const sent = await sendModerationLog({
      guild: ctx.guild,
      repos: ctx.repos,
      channelId: ctx.config.modlogChannelId,
      color: violation.category === 'raid' ? EMBED_COLORS.ERROR : EMBED_COLORS.WARNING,
      title: `${titlePrefix} - ${violation.type}`,
      description: [
        `Reason: ${violation.reason}`,
        `Action: ${actionLabel}`,
        jumpUrl ? `Message: ${jumpUrl}` : null
      ].filter(Boolean).join('\n'),
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
          name: 'Channel / Event',
          value: channelLabel,
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
          name: 'Duration',
          value: formatDuration(details.duration),
          inline: true
        },
        {
          name: 'Severity',
          value: `${violation.severity}/5`,
          inline: true
        },
        {
          name: 'Rule Metadata',
          value: truncate(formatMeta(metadata)),
          inline: false
        },
        {
          name: 'Content',
          value: content,
          inline: false
        }
      ],
      footerText: `Guild ${ctx.guild.id} | ${ctx.kind}`
    });

    if (!sent) {
      logger.warn('Failed to send moderation log', {
        guildId: ctx.guild.id,
        violation: violation.type,
        userId: ctx.user?.id || ctx.member?.id || null
      });
    }
  }

  async function processViolation(ctx, violation) {
    let finalAction = 'none';
    let warnResult = null;
    let duration = null;
    let revoked = null;

    if (violation.flags.delete) {
      const deleted = await runModerationAction(ctx, 'delete-message', () => deleteMessage(ctx));
      if (deleted) {
        finalAction = 'delete-message';
      }
    }

    if (violation.flags.deleteWebhooks) {
      const deleted = await runModerationAction(ctx, 'delete-webhooks', () => deleteWebhooks(ctx));
      if (deleted) {
        finalAction = 'delete-webhooks';
      }
    }

    if (violation.flags.slowmode) {
      const slowed = await runModerationAction(ctx, 'slowmode', () =>
        slowmode(ctx, {
          seconds: violation.meta.slowmodeSeconds || 15
        })
      );

      if (slowed) {
        finalAction = 'slowmode';
      }
    }

    if (violation.flags.kick) {
      if (violation.type === 'bot-add') {
        ctx.violation = violation;
        revoked = await revokeInviterAdmin(ctx);

        const punishmentRoleId = violation.meta.invaderRoleId;
        const inviterId = violation.meta.inviterId;
        if (punishmentRoleId && inviterId) {
          const inviter = await ctx.guild.members.fetch(inviterId).catch(() => null);
          if (inviter) {
            await inviter.roles.add(punishmentRoleId, 'AutoMod anti-bot punishment').catch(() => null);

            const dangerousPermissions = [
              PermissionFlagsBits.Administrator,
              PermissionFlagsBits.ManageGuild,
              PermissionFlagsBits.ManageRoles,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ManageWebhooks,
              PermissionFlagsBits.BanMembers,
              PermissionFlagsBits.KickMembers,
              PermissionFlagsBits.ModerateMembers
            ];

            const elevatedRoles = inviter.roles.cache.filter((existingRole) => {
              if (existingRole.id === punishmentRoleId || existingRole.id === ctx.guild.id || existingRole.managed) {
                return false;
              }
              return (
                existingRole.position >= inviter.roles.highest.position ||
                dangerousPermissions.some((permission) => existingRole.permissions.has(permission))
              );
            });

            await Promise.all(
              elevatedRoles.map((existingRole) =>
                inviter.roles.remove(existingRole, 'Removed elevated roles as part of AutoMod antibot jail').catch(() => null)
              )
            );
          }
        }
      }

      const kicked = await runModerationAction(ctx, 'kick', () =>
        kickMember(ctx, {
          reason: violation.reason
        })
      );

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
      const banned = await runModerationAction(ctx, 'ban', () =>
        banMember(ctx, {
          reason: violation.reason
        })
      );

      if (banned) {
        finalAction = 'ban';
      }
    } else {
      const escalationResult = await applyEscalation(ctx, violation, warnResult);
      if (escalationResult?.action) {
        finalAction = escalationResult.action;
        duration = escalationResult.duration;
      }
    }

    await notifyChannel(ctx, violation);
    await sendModlog(ctx, violation, {
      finalAction,
      warnCount: warnResult?.warnCount || 0,
      duration,
      revoked
    });

    return {
      ...violation,
      finalAction,
      warnCount: warnResult?.warnCount || 0
    };
  }

  async function handleMessage(message) {
    if (message.channelId === AUTOMOD_SPAM_ALLOWED_CHANNEL_ID) {
      return null;
    }

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

    if (
      message.channelId !== AUTOMOD_PROTECTED_CHANNEL_ID &&
      (await ctx.isPrivilegedAutomodUser(message.author.id))
    ) {
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

    if (!member.user?.bot && (await ctx.isPrivilegedAutomodUser(member.id))) {
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
