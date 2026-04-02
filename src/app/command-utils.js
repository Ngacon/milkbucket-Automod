function parseDuration(input) {
  if (!input) {
    return null;
  }

  const match = String(input).trim().match(/^(\d+)(s|m|h|d)?$/i);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  const unit = (match[2] || 'm').toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return value * (multipliers[unit] || multipliers.m);
}

function formatDuration(ms) {
  if (!ms) {
    return '0s';
  }
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function extractId(input) {
  if (!input) {
    return null;
  }
  const match = String(input).match(/\d{17,}/);
  return match ? match[0] : null;
}

async function resolveMember(message, input) {
  const id = extractId(input);
  if (!id || !message.guild) {
    return null;
  }
  return message.guild.members.fetch(id).catch(() => null);
}

async function resolveUser(client, input) {
  const id = extractId(input);
  if (!id) {
    return null;
  }
  return client.users.fetch(id).catch(() => null);
}

function getModerationBlock(commandName, member) {
  if (!member) {
    return null;
  }

  const normalizedCommand = String(commandName || '').toLowerCase();

  if (['ban', 'softban'].includes(normalizedCommand) && !member.bannable) {
    return {
      key: 'common.errors.targetAboveBot',
      params: {
        user: member.user.tag
      }
    };
  }

  if (normalizedCommand === 'kick' && !member.kickable) {
    return {
      key: 'common.errors.targetAboveBot',
      params: {
        user: member.user.tag
      }
    };
  }

  if (['mute', 'unmute', 'timeout', 'untimeout'].includes(normalizedCommand) && !member.moderatable) {
    return {
      key: 'common.errors.targetAboveBot',
      params: {
        user: member.user.tag
      }
    };
  }

  return null;
}

function resolveRole(message, input) {
  if (!message.guild) {
    return null;
  }

  const id = extractId(input);
  if (id) {
    return message.guild.roles.cache.get(id) || null;
  }

  const normalizedName = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');

  if (!normalizedName) {
    return null;
  }

  return (
    message.guild.roles.cache.find((role) => role.name.toLowerCase() === normalizedName) ||
    null
  );
}

function resolveChannel(message, input) {
  if (!message.guild) {
    return null;
  }

  const id = extractId(input);
  if (id) {
    return message.guild.channels.cache.get(id) || null;
  }

  const normalizedName = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/^#/, '');

  if (!normalizedName) {
    return null;
  }

  return (
    message.guild.channels.cache.find((channel) => channel.name.toLowerCase() === normalizedName) ||
    null
  );
}

module.exports = {
  parseDuration,
  formatDuration,
  extractId,
  resolveMember,
  resolveUser,
  getModerationBlock,
  resolveRole,
  resolveChannel
};
