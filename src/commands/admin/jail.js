const {
  parseDuration,
  formatDuration,
  resolveMember,
  getModerationBlock
} = require('../../app/command-utils');
const { PermissionFlagsBits } = require('discord.js');
const { BOT_EMOJIS, EMBED_COLORS, JAIL_ROLE_ID } = require('../../config/constants');
const { sendModerationLog } = require('../../services/moderation/modlog');

module.exports = {
  meta: {
    name: 'jail',
    aliases: [],
    category: 'admin',
    permissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    cooldown: 2,
    args: { min: 1, max: 20, usage: 'jail @user [time] [reason]' },
    descriptionKey: 'admin.descriptions.jail',
    guildOnly: true
  },
  async execute({ message, args, t, respond, repos }) {
    const targetArg = args.shift();
    const durationArg = args.shift();
    const reason = args.join(' ').trim() || null;
    const member = await resolveMember(message, targetArg);

    if (!member) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: t('admin.responses.invalidJailInput')
      });
      return;
    }

    const moderationBlock = getModerationBlock('timeout', member);
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

    const shouldNeverRelease =
      !durationArg ||
      durationArg.toLowerCase() === 'forever' ||
      durationArg.toLowerCase() === 'never';

    const duration = shouldNeverRelease ? null : parseDuration(durationArg);
    if (!shouldNeverRelease && !duration) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: t('admin.responses.invalidJailInput')
      });
      return;
    }

    const role = message.guild.roles.cache.get(JAIL_ROLE_ID);
    if (!role) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: t('admin.responses.jailRoleMissing')
      });
      return;
    }

    await member.roles.add(role, 'Jail applied by admin command').catch(() => null);

    const elevatedRoles = member.roles.cache.filter((existingRole) => {
      if (existingRole.id === role.id || existingRole.id === message.guild.id || existingRole.managed) {
        return false;
      }

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

      if (dangerousPermissions.some((permission) => existingRole.permissions.has(permission))) {
        return true;
      }

      return existingRole.position >= role.position;
    });

    await Promise.all(
      elevatedRoles.map((existingRole) =>
        member.roles.remove(existingRole, 'Removed elevated roles while jailing member').catch(() => null)
      )
    );

    if (duration != null) {
      await member.timeout(duration, reason || undefined).catch(() => null);
    }

    await sendModerationLog({
      guild: message.guild,
      repos,
      color: EMBED_COLORS.WARNING,
      title: t('moderation.responses.logTitle', {
        action: t('moderation.actions.timeout')
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
          name: t('moderation.labels.duration'),
          value: shouldNeverRelease ? t('admin.responses.jailPermanent') : formatDuration(duration),
          inline: true
        },
        {
          name: t('moderation.labels.reason'),
          value: reason || t('moderation.responses.noReason'),
          inline: false
        }
      ]
    });

    await respond({
      color: EMBED_COLORS.ERROR,
      title: t('admin.responses.jailTitle'),
      author: {
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ size: 128 })
      },
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      description: shouldNeverRelease
        ? t('admin.responses.jailAppliedPermanent', { user: member.user.tag })
        : t('admin.responses.jailApplied', {
            user: member.user.tag,
            duration: formatDuration(duration)
          }),
      fields: [
        {
          name: t('moderation.labels.user'),
          value: `${member.user.tag}\n\`${member.id}\``,
          inline: true
        },
        {
          name: t('moderation.labels.duration'),
          value: shouldNeverRelease ? t('admin.responses.jailPermanent') : formatDuration(duration),
          inline: true
        },
        {
          name: t('moderation.labels.reason'),
          value: reason || t('moderation.responses.noReason'),
          inline: false
        }
      ]
    });
  }
};
