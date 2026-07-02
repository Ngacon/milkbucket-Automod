const {
  resolveTargetMessage,
  formatStoredReactionEmoji
} = require('../../app/reaction-role-utils');
const { findReactionOnMessage } = require('../../services/reaction-role-service');
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
    name: 'reaction-role-list',
    aliases: ['reactionrolelist'],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles', 'ReadMessageHistory', 'ViewChannel'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'reaction-role-list [message_link|message_id]' },
    examples: [
      'reaction role list 123456789012345678',
      'reaction role list https://discord.com/channels/123/456/789'
    ],
    descriptionKey: 'roles.descriptions.reactionRoleList',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
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
        title: t('roles.responses.reactionRoleListTitle'),
        description: t('roles.responses.reactionRoleListEmpty'),
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
          }
        ]
      });
      return;
    }

    const lines = entries.map((entry) => {
      const reaction = findReactionOnMessage(targetResult.targetMessage, entry.emoji);
      const emojiDisplay = reaction?.emoji?.toString() || formatStoredReactionEmoji(entry.emoji);
      return `- ${emojiDisplay} -> <@&${entry.role_id}>`;
    });

    await respond({
      color: EMBED_COLORS.ACCENT,
      title: t('roles.responses.reactionRoleListTitle'),
      description: t('roles.responses.reactionRoleListSummary', {
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
        ...chunkLines(lines).map((value, index) => ({
          name:
            index === 0
              ? t('roles.labels.mappings')
              : `${t('roles.labels.mappings')} ${index + 1}`,
          value,
          inline: false
        }))
      ]
    });
  }
};
