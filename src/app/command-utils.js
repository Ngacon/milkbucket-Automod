function parseDuration(input) {
  if (!input) {
    return null;
  }

  const normalized = String(input).trim().toLowerCase();
  const matches = [...normalized.matchAll(/(\d+)(s|m|h|d)/g)];

  if (matches.length > 0) {
    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };

    const consumed = matches.map((match) => match[0]).join('');
    if (consumed !== normalized) {
      return null;
    }

    return matches.reduce(
      (total, [, rawValue, unit]) => total + Number(rawValue) * multipliers[unit],
      0
    );
  }

  const match = normalized.match(/^(\d+)$/);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  return value * 60 * 1000;
}

function formatDuration(ms) {
  if (!ms) {
    return '0s';
  }

  let remaining = Math.max(0, Math.floor(ms / 1000));
  const units = [
    ['d', 24 * 60 * 60],
    ['h', 60 * 60],
    ['m', 60],
    ['s', 1]
  ];
  const parts = [];

  for (const [unit, seconds] of units) {
    if (remaining < seconds && parts.length === 0 && unit !== 's') {
      continue;
    }

    const value = Math.floor(remaining / seconds);
    remaining -= value * seconds;

    if (value > 0 || (unit === 's' && parts.length === 0)) {
      parts.push(`${value}${unit}`);
    }

    if (parts.length === 2) {
      break;
    }
  }

  return parts.join(' ');
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
  if (!message.guild) {
    return null;
  }

  if (id) {
    return message.guild.members.fetch(id).catch(() => null);
  }

  const normalizedQuery = String(input || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return null;
  }

  const members = [...message.guild.members.cache.values()];
  const exactMatch =
    members.find((member) => member.user.tag.toLowerCase() === normalizedQuery) ||
    members.find((member) => member.user.username.toLowerCase() === normalizedQuery) ||
    members.find((member) => member.displayName.toLowerCase() === normalizedQuery) ||
    null;

  if (exactMatch) {
    return exactMatch;
  }

  return (
    members.find(
      (member) =>
        member.user.tag.toLowerCase().includes(normalizedQuery) ||
        member.user.username.toLowerCase().includes(normalizedQuery) ||
        member.displayName.toLowerCase().includes(normalizedQuery)
    ) || null
  );
}

async function resolveUser(client, input) {
  const id = extractId(input);
  if (!id) {
    return null;
  }
  return client.users.fetch(id).catch(() => null);
}

function getModerationBlock(commandName, member, message) {
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

  if (message && !canActOnMember(message, member)) {
    return {
      key: 'common.errors.targetAboveBot',
      params: {
        user: member.user.tag
      }
    };
  }

  return null;
}

function compareRolePositions(leftRole, rightRole) {
  if (!leftRole || !rightRole) {
    return 0;
  }

  if (leftRole.position !== rightRole.position) {
    return leftRole.position - rightRole.position;
  }

  return rightRole.id.localeCompare(leftRole.id);
}

function isRoleHigherOrEqual(leftRole, rightRole) {
  return compareRolePositions(leftRole, rightRole) >= 0;
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

  const roles = [...message.guild.roles.cache.values()];
  const exactRole =
    roles.find((role) => role.name.toLowerCase() === normalizedName) || null;

  if (exactRole) {
    return exactRole;
  }

  const partialMatches = roles
    .filter((role) => role.name.toLowerCase().includes(normalizedName))
    .sort((left, right) => compareRolePositions(right, left));

  return partialMatches[0] || null;
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

function canActOnRole(message, role) {
  if (!message.guild || !role) {
    return {
      ok: false,
      reason: 'invalidRole'
    };
  }

  if (role.managed || role.id === message.guild.id) {
    return {
      ok: false,
      reason: 'roleProtected'
    };
  }

  const botHighestRole = message.guild.members.me?.roles?.highest || null;
  if (!botHighestRole || isRoleHigherOrEqual(role, botHighestRole)) {
    return {
      ok: false,
      reason: 'roleAboveBot'
    };
  }

  const actorHighestRole = message.member?.roles?.highest || null;
  const isGuildOwner = message.guild.ownerId === message.author.id;

  if (!isGuildOwner && actorHighestRole && isRoleHigherOrEqual(role, actorHighestRole)) {
    return {
      ok: false,
      reason: 'roleAboveUser'
    };
  }

  return {
    ok: true
  };
}

function canActOnMember(message, member) {
  if (!message.guild || !member) {
    return false;
  }

  const actorHighestRole = message.member?.roles?.highest || null;
  const isGuildOwner = message.guild.ownerId === message.author.id;

  if (member.id === message.guild.ownerId) {
    return false;
  }

  if (!isGuildOwner && actorHighestRole && member.roles?.highest) {
    if (isRoleHigherOrEqual(member.roles.highest, actorHighestRole)) {
      return false;
    }
  }

  return Boolean(member.manageable);
}

async function runBatchedOperations(items, worker, options = {}) {
  const concurrency = Math.max(1, Number(options.concurrency) || 1);
  const results = [];
  let index = 0;

  async function consume() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => consume())
  );

  return results;
}

module.exports = {
  parseDuration,
  formatDuration,
  extractId,
  resolveMember,
  resolveUser,
  getModerationBlock,
  resolveRole,
  resolveChannel,
  compareRolePositions,
  canActOnRole,
  canActOnMember,
  runBatchedOperations
};
