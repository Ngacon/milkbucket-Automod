const { PermissionFlagsBits } = require('discord.js');
const { extractId } = require('./command-utils');

const MESSAGE_LINK_PATTERN =
  /^https?:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/channels\/(\d{17,}|@me)\/(\d{17,})\/(\d{17,})\/?$/i;

function resolvePermission(permission) {
  if (typeof permission === 'bigint') {
    return permission;
  }

  return PermissionFlagsBits[permission] || permission;
}

function parseMessageReference(input, fallbackChannelId) {
  const value = String(input || '').trim();

  if (!value) {
    return null;
  }

  const linkMatch = value.match(MESSAGE_LINK_PATTERN);
  if (linkMatch) {
    const [, guildId, channelId, messageId] = linkMatch;

    if (guildId === '@me') {
      return null;
    }

    return {
      source: 'link',
      guildId,
      channelId,
      messageId
    };
  }

  const messageId = extractId(value);
  if (!messageId) {
    return null;
  }

  return {
    source: 'id',
    guildId: null,
    channelId: fallbackChannelId || null,
    messageId
  };
}

function normalizeReactionEmoji(input) {
  if (!input) {
    return null;
  }

  if (typeof input === 'string') {
    const value = input.trim();

    if (!value) {
      return null;
    }

    const canonicalCustomMatch = value.match(/^custom:(\d{17,})$/);
    if (canonicalCustomMatch) {
      const [, id] = canonicalCustomMatch;

      return {
        key: `custom:${id}`,
        type: 'custom',
        id,
        name: null,
        animated: false,
        display: `custom:${id}`
      };
    }

    const canonicalUnicodeMatch = value.match(/^unicode:(.+)$/);
    if (canonicalUnicodeMatch) {
      const [, emojiValue] = canonicalUnicodeMatch;
      const normalized = emojiValue.normalize('NFC');

      return {
        key: `unicode:${normalized}`,
        type: 'unicode',
        id: null,
        name: normalized,
        animated: false,
        display: normalized
      };
    }

    const customMatch = value.match(/^<(a?):([^:]+):(\d{17,})>$/);
    if (customMatch) {
      const [, animatedFlag, name, id] = customMatch;
      const animated = animatedFlag === 'a';

      return {
        key: `custom:${id}`,
        type: 'custom',
        id,
        name,
        animated,
        display: `<${animated ? 'a' : ''}:${name}:${id}>`
      };
    }

    const normalized = value.normalize('NFC');
    return {
      key: `unicode:${normalized}`,
      type: 'unicode',
      id: null,
      name: normalized,
      animated: false,
      display: normalized
    };
  }

  if (typeof input === 'object') {
    if (input.id) {
      const name = input.name || 'emoji';
      const animated = Boolean(input.animated);

      return {
        key: `custom:${input.id}`,
        type: 'custom',
        id: input.id,
        name,
        animated,
        display: `<${animated ? 'a' : ''}:${name}:${input.id}>`
      };
    }

    if (input.emoji) {
      return normalizeReactionEmoji(input.emoji);
    }

    if (input.name) {
      return normalizeReactionEmoji(input.name);
    }

    if (typeof input.toString === 'function') {
      return normalizeReactionEmoji(input.toString());
    }
  }

  return null;
}

function getReactionEmojiLookupKeys(input) {
  const normalized = normalizeReactionEmoji(input);
  if (!normalized) {
    return [];
  }

  const keys = [normalized.key];

  if (normalized.type === 'custom') {
    keys.push(normalized.display);
    keys.push(normalized.id);

    if (normalized.name && normalized.id) {
      keys.push(`<:${normalized.name}:${normalized.id}>`);
      keys.push(`<a:${normalized.name}:${normalized.id}>`);
    }
  } else {
    keys.push(normalized.display);
  }

  return [...new Set(keys.filter(Boolean))];
}

function formatStoredReactionEmoji(value) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    return '?';
  }

  if (normalizedValue.startsWith('unicode:')) {
    return normalizedValue.slice('unicode:'.length);
  }

  if (normalizedValue.startsWith('custom:')) {
    return `custom:${normalizedValue.slice('custom:'.length)}`;
  }

  return normalizedValue;
}

function getMissingChannelPermissions(channel, member, permissions = []) {
  const channelPermissions = channel?.permissionsFor(member) || null;

  return permissions.filter((permission) => {
    const resolvedPermission = resolvePermission(permission);
    return !channelPermissions?.has(resolvedPermission);
  });
}

async function resolveTargetMessage(message, input, options = {}) {
  if (!message?.guild) {
    return {
      ok: false,
      reason: 'invalidMessage'
    };
  }

  const reference = parseMessageReference(input, message.channelId);
  if (!reference) {
    return {
      ok: false,
      reason: 'invalidMessage'
    };
  }

  if (reference.guildId && reference.guildId !== message.guild.id) {
    return {
      ok: false,
      reason: 'wrongGuild'
    };
  }

  let channel = message.channel;
  if (reference.channelId && reference.channelId !== message.channelId) {
    channel = await message.guild.channels.fetch(reference.channelId).catch(() => null);
  }

  if (!channel || typeof channel.messages?.fetch !== 'function') {
    return {
      ok: false,
      reason: 'messageNotFound'
    };
  }

  const botMember =
    message.guild.members.me || (await message.guild.members.fetchMe().catch(() => null));
  const missingPermissions = getMissingChannelPermissions(
    channel,
    botMember,
    options.requiredPermissions || []
  );

  if (missingPermissions.length > 0) {
    return {
      ok: false,
      reason: 'missingPermissions',
      missingPermissions
    };
  }

  const targetMessage = await channel.messages.fetch(reference.messageId).catch(() => null);
  if (!targetMessage) {
    return {
      ok: false,
      reason: 'messageNotFound'
    };
  }

  return {
    ok: true,
    reference,
    channel,
    targetMessage,
    guildId: message.guild.id,
    channelId: channel.id,
    messageId: reference.messageId
  };
}

module.exports = {
  parseMessageReference,
  normalizeReactionEmoji,
  getReactionEmojiLookupKeys,
  formatStoredReactionEmoji,
  getMissingChannelPermissions,
  resolveTargetMessage
};
