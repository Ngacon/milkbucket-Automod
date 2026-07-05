const { resolveMember, getModerationBlock } = require('../../app/command-utils');
const { BOT_EMOJIS, EMBED_COLORS } = require('../../config/constants');
const { sendModerationLog } = require('../../services/moderation/modlog');
const { resolveEscalationRule } = require('../../services/moderation/escalation');
const timeoutMember = require('../../services/moderation/actions/timeout');
const kickMember = require('../../services/moderation/actions/kick');
const banMember = require('../../services/moderation/actions/ban');
const jailMember = require('../../services/moderation/actions/jail');
module.exports = {
  meta: {
    name: 'warn',
    aliases: [],
    category: 'admin',
    permissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    cooldown: 2,
    args: { min: 1, max: 20, usage: 'warn @user [reason]' },
    descriptionKey: 'admin.descriptions.warn',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const targetArg = args.shift();
    const reason = args.join(' ').trim() || null;
    const member = await resolveMember(message, targetArg);

    if (!member) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    if (member.id === message.author.id) {
      await respond({
        description: t('common.errors.cannotTargetSelf')
      });
      return;
    }

    const moderationBlock = getModerationBlock('warn', member, message);
    if (moderationBlock) {
      await respond({
        color: EMBED_COLORS.ERROR,
        author: {
          name: member.user.tag,
          iconURL: member.user.displayAvatarURL({ size: 128 })
        },
        description: `${BOT_EMOJIS.HIERARCHY.mention} ${t(moderationBlock.key, moderationBlock.params)}`,
        thumbnail: BOT_EMOJIS.HIERARCHY.imageUrl
      });
      return;
    }

    const warning = await repos.warningsRepo.addWarning({
      guildId: message.guild.id,
      userId: member.id,
      moderatorId: message.author.id,
      reason
    });

    const config = await repos.automodRepo.getConfig(message.guild.id);
    const warnCount = await repos.warningsRepo.countWarningsWithinWindow({
      guildId: message.guild.id,
      userId: member.id,
      timeWindowSeconds: config.timeWindow
    });

    await sendModerationLog({
      guild: message.guild,
      repos,
      color: EMBED_COLORS.WARNING,
      title: t('moderation.responses.logTitle', {
        action: t('moderation.actions.warn')
      }),
      description: reason || t('moderation.responses.noReason'),
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      fields: [
        {
          name: t('moderation.labels.user'),
          value: `${member.user.tag} (${member.id})`,
          inline: false
        },
        {
          name: t('moderation.labels.moderator'),
          value: `${message.author.tag} (${message.author.id})`,
          inline: false
        },
        {
          name: t('moderation.labels.warningId'),
          value: `${warning.id}`,
          inline: true
        },
        {
          name: t('moderation.labels.warnCount'),
          value: `${warnCount}`,
          inline: true
        },
        {
          name: t('moderation.labels.reason'),
          value: reason || t('moderation.responses.noReason'),
          inline: false
        }
      ]
    });

    const escalationRule = resolveEscalationRule({
      warnCount,
      thresholds: config.thresholds
    });

    if (escalationRule) {
      const ctx = {
        guild: message.guild,
        member,
        user: member.user,
        message,
        logger: null
      };

      if (escalationRule.action === 'msg') {
        await member.send(escalationRule.message || reason || 'You have received a warning.').catch(() => null);
      } else if (escalationRule.action === 'timeout') {
        await timeoutMember(ctx, {
          reason: reason || 'Warning threshold reached',
          duration: escalationRule.duration
        }).catch(() => null);
      } else if (escalationRule.action === 'kick') {
        await kickMember(ctx, {
          reason: reason || 'Warning threshold reached'
        }).catch(() => null);
      } else if (escalationRule.action === 'ban') {
        await banMember(ctx, {
          reason: reason || 'Warning threshold reached'
        }).catch(() => null);
      } else if (escalationRule.action === 'jail') {
        await jailMember(ctx, {
          reason: reason || 'Warning threshold reached',
          duration: escalationRule.duration
        }).catch(() => null);
      }
    }

    await respond({
      author: {
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ size: 128 })
      },
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      description: t('admin.responses.warnAdded', {
        user: member.user.tag,
        id: warning.id
      })
    });
  }
};

