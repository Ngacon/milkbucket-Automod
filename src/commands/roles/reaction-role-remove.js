const {
  resolveTargetMessage,
  normalizeReactionEmoji,
  getReactionEmojiLookupKeys,
  formatStoredReactionEmoji
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
    name: 'reaction-role-remove',
    aliases: ['reactionroleremove'],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles', 'ReadMessageHistory', 'ViewChannel'],
    cooldown: 2,
    args: {
      min: 2,
      max: 3,
      usage: 'reaction-role-remove [message_link|message_id] [emoji] [--revoke]'
    },
    examples: [
      'reaction role remove 123456789012345678 👍',
      'reaction role remove https://discord.com/channels/123/456/789 <:milk:123456789012345678> --revoke'
    ],
    descriptionKey: 'roles.descriptions.reactionRoleRemove',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond, logger }) {
    const shouldRevoke = args.includes('--revoke');
    const filteredArgs = args.filter((arg) => arg !== '--revoke');
    const targetArg = filteredArgs[0];
    const emojiArg = filteredArgs[1];

    const targetResult = await resolveTargetMessage(message, targetArg, {
      requiredPermissions: ['ViewChannel', 'ReadMessageHistory']
    });

    if (!targetResult.ok) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: getTargetResolutionDescription(t, targetResult)
      });
      return;
    }

    const normalizedEmoji = normalizeReactionEmoji(emojiArg);
    if (!normalizedEmoji) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: t('roles.responses.reactionRoleEmojiInvalid')
      });
      return;
    }

    const entry = await repos.reactionRoleRepo.getByMessageAndEmoji({
      messageId: targetResult.messageId,
      emojiValues: getReactionEmojiLookupKeys(emojiArg),
      preferredEmoji: normalizedEmoji.key
    });

    if (!entry) {
      await respond({
        color: EMBED_COLORS.WARNING,
        title: t('roles.responses.reactionRoleRemoveTitle'),
        description: t('roles.responses.reactionRoleRemoveMissing', {
          emoji: normalizedEmoji.display
        })
      });
      return;
    }

    const removedEntry = await repos.reactionRoleRepo.removeReactionRole({
      messageId: targetResult.messageId,
      emojiValues: getReactionEmojiLookupKeys(emojiArg),
      preferredEmoji: normalizedEmoji.key
    });

    if (!removedEntry) {
      await respond({
        color: EMBED_COLORS.WARNING,
        title: t('roles.responses.reactionRoleRemoveTitle'),
        description: t('roles.responses.reactionRoleRemoveMissing', {
          emoji: normalizedEmoji.display
        })
      });
      return;
    }

    const remainingEntries = await repos.reactionRoleRepo.getByMessage(targetResult.messageId);
    let revokeResult = null;
    if (shouldRevoke) {
      revokeResult = await syncReactionRoleMembers({
        targetMessage: targetResult.targetMessage,
        entry: removedEntry,
        action: 'remove',
        logger
      });
    }

    await respond({
      color: EMBED_COLORS.ACCENT,
      title: t('roles.responses.reactionRoleRemoveTitle'),
      description: shouldRevoke
        ? t('roles.responses.reactionRoleRemovedAndRevoked', {
            emoji: normalizedEmoji.display
          })
        : t('roles.responses.reactionRoleRemoved', {
            emoji: normalizedEmoji.display
          }),
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
          name: t('roles.labels.emoji'),
          value: normalizedEmoji.display || formatStoredReactionEmoji(removedEntry.emoji),
          inline: true
        },
        {
          name: t('roles.labels.role'),
          value: `<@&${removedEntry.role_id}>`,
          inline: true
        },
        {
          name: t('roles.labels.status'),
          value: shouldRevoke
            ? t('roles.labels.revoked')
            : t('roles.labels.removed'),
          inline: true
        },
        {
          name: t('roles.labels.mappings'),
          value: String(remainingEntries.length),
          inline: true
        },
        ...(shouldRevoke
          ? [
              {
                name: t('roles.labels.revoked'),
                value: String(revokeResult?.changed || 0),
                inline: true
              },
              {
                name: t('roles.labels.skipped'),
                value: String(revokeResult?.skipped || 0),
                inline: true
              },
              {
                name: t('roles.labels.failed'),
                value: String(revokeResult?.failed || 0),
                inline: true
              }
            ]
          : [])
      ]
    });
  }
};
