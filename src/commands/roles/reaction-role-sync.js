const { resolveTargetMessage, formatStoredReactionEmoji } = require('../../app/reaction-role-utils');
const { findReactionOnMessage, syncReactionRoleMembers } = require('../../services/reaction-role-service');
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

function chunkLines(lines, maxLength = 900) {
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const line of lines) {
    if (currentLength + line.length + 1 > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
      currentChunk = [];
      currentLength = 0;
    }

    currentChunk.push(line);
    currentLength += line.length + 1;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  return chunks;
}

module.exports = {
  meta: {
    name: 'reaction-role-sync',
    aliases: ['reactionrolesync'],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles', 'ReadMessageHistory', 'ViewChannel'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'reaction-role-sync [message_link|message_id]' },
    examples: [
      'reaction role sync 123456789012345678',
      'reaction role sync https://discord.com/channels/123/456/789'
    ],
    descriptionKey: 'roles.descriptions.reactionRoleSync',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond, logger }) {
    const targetResult = await resolveTargetMessage(message, args[0], {
      requiredPermissions: ['ViewChannel', 'ReadMessageHistory']
    });

    if (!targetResult.ok) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: getTargetResolutionDescription(t, targetResult)
      });
      return;
    }

    const entries = await repos.reactionRoleRepo.getByMessage(targetResult.messageId);
    if (entries.length === 0) {
      await respond({
        color: EMBED_COLORS.WARNING,
        title: t('roles.responses.reactionRoleSyncTitle'),
        description: t('roles.responses.reactionRoleListEmpty')
      });
      return;
    }

    const lines = [];
    let totalChanged = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const entry of entries) {
      const result = await syncReactionRoleMembers({
        targetMessage: targetResult.targetMessage,
        entry,
        action: 'add',
        logger
      });

      totalChanged += result.changed || 0;
      totalSkipped += result.skipped || 0;
      totalFailed += result.failed || 0;

      const reaction = findReactionOnMessage(targetResult.targetMessage, entry.emoji);
      const emojiDisplay = reaction?.emoji?.toString() || formatStoredReactionEmoji(entry.emoji);

      if (result.reason === 'roleMissing') {
        lines.push(`- ${emojiDisplay} -> <@&${entry.role_id}> • ${t('roles.responses.reactionRoleRoleMissing')}`);
        continue;
      }

      if (result.missingReaction) {
        lines.push(`- ${emojiDisplay} -> <@&${entry.role_id}> • ${t('roles.responses.reactionRoleSyncMissingReaction')}`);
        continue;
      }

      lines.push(
        `- ${emojiDisplay} -> <@&${entry.role_id}> • +${result.changed} / ${t('roles.labels.skipped')}: ${result.skipped} / ${t('roles.labels.failed')}: ${result.failed}`
      );
    }

    await respond({
      color: EMBED_COLORS.ACCENT,
      title: t('roles.responses.reactionRoleSyncTitle'),
      description: t('roles.responses.reactionRoleSyncDone', {
        count: entries.length
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
          name: t('roles.labels.mappings'),
          value: String(entries.length),
          inline: true
        },
        {
          name: t('roles.labels.added'),
          value: String(totalChanged),
          inline: true
        },
        {
          name: t('roles.labels.skipped'),
          value: String(totalSkipped),
          inline: true
        },
        {
          name: t('roles.labels.failed'),
          value: String(totalFailed),
          inline: true
        },
        ...chunkLines(lines).map((value, index) => ({
          name:
            index === 0
              ? t('roles.labels.status')
              : `${t('roles.labels.status')} ${index + 1}`,
          value,
          inline: false
        }))
      ]
    });
  }
};
