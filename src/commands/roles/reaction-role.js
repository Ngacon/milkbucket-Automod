const { resolveRole, canActOnRole } = require('../../app/command-utils');
const {
  resolveTargetMessage,
  normalizeReactionEmoji,
  getReactionEmojiLookupKeys
} = require('../../app/reaction-role-utils');
const { syncReactionRoleMembers } = require('../../services/reaction-role-service');
const { EMBED_COLORS } = require('../../config/constants');

function getTargetResolutionDescription(t, targetResult) {
  if (targetResult.reason === 'missingPermissions') {
    return t('common.errors.missingBotPermissions', {
      permissions: targetResult.missingPermissions.join(', ')
    });
  }

  if (targetResult.reason === 'wrongGuild') {
    return t('roles.responses.reactionRoleWrongGuild');
  }

  if (targetResult.reason === 'messageNotFound') {
    return t('roles.responses.reactionRoleMessageNotFound');
  }

  return t('roles.responses.reactionRoleInvalidMessage');
}

module.exports = {
  meta: {
    name: 'reaction-role',
    aliases: ['reactionrole'],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles', 'AddReactions', 'ReadMessageHistory', 'ViewChannel'],
    cooldown: 2,
    args: { min: 3, max: 20, usage: 'reaction-role [message_link|message_id] [emoji] @role' },
    examples: [
      'reaction role 123456789012345678 👍 @role',
      'reaction role https://discord.com/channels/123/456/789 <:milk:123456789012345678> @role'
    ],
    descriptionKey: 'roles.descriptions.reactionRole',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond, logger }) {
    const targetResult = await resolveTargetMessage(message, args[0], {
      requiredPermissions: ['ViewChannel', 'ReadMessageHistory', 'AddReactions']
    });

    if (!targetResult.ok) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: getTargetResolutionDescription(t, targetResult)
      });
      return;
    }

    const emojiInput = args[1];
    const normalizedEmoji = normalizeReactionEmoji(emojiInput);
    const role = resolveRole(message, args.slice(2).join(' '));

    if (!normalizedEmoji) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: t('roles.responses.reactionRoleEmojiInvalid')
      });
      return;
    }

    if (!role) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const roleAccess = canActOnRole(message, role);
    if (!roleAccess.ok) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: t(`roles.responses.${roleAccess.reason}`, {
          role: role.name
        })
      });
      return;
    }

    const reacted = await targetResult.targetMessage.react(emojiInput).catch((error) => {
      logger.warn('Failed to react to target message for reaction role', {
        error,
        guildId: message.guild.id,
        channelId: targetResult.channelId,
        messageId: targetResult.messageId
      });
      return null;
    });

    if (!reacted) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: t('roles.responses.reactionRoleEmojiInvalid')
      });
      return;
    }

    const saveResult = await repos.reactionRoleRepo.upsertReactionRole({
      guildId: message.guild.id,
      channelId: targetResult.channelId,
      messageId: targetResult.messageId,
      roleId: role.id,
      emoji: normalizedEmoji.key,
      emojiAliases: getReactionEmojiLookupKeys(emojiInput)
    });

    const syncResult = await syncReactionRoleMembers({
      targetMessage: targetResult.targetMessage,
      entry: saveResult.entry,
      action: 'add',
      logger
    });

    await respond({
      color: EMBED_COLORS.ACCENT,
      title: t('roles.responses.reactionRoleSetTitle'),
      description: t(
        saveResult.created
          ? 'roles.responses.reactionRoleCreated'
          : 'roles.responses.reactionRoleUpdated',
        {
          emoji: normalizedEmoji.display,
          role: role.name
        }
      ),
      fields: [
        {
          name: t('roles.labels.message'),
          value: `\`${targetResult.messageId}\``,
          inline: true
        },
        {
          name: t('roles.labels.channel'),
          value: `<#${targetResult.channelId}>`,
          inline: true
        },
        {
          name: t('roles.labels.status'),
          value: saveResult.created
            ? t('roles.labels.created')
            : t('roles.labels.updated'),
          inline: true
        },
        {
          name: t('roles.labels.emoji'),
          value: normalizedEmoji.display,
          inline: true
        },
        {
          name: t('roles.labels.role'),
          value: `<@&${role.id}>`,
          inline: true
        },
        {
          name: t('roles.labels.added'),
          value: String(syncResult.changed),
          inline: true
        },
        {
          name: t('roles.labels.skipped'),
          value: String(syncResult.skipped),
          inline: true
        },
        {
          name: t('roles.labels.failed'),
          value: String(syncResult.failed),
          inline: true
        }
      ]
    });
  }
};
