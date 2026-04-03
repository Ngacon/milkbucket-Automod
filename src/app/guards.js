const { PermissionFlagsBits } = require('discord.js');
const { BOT_OWNER_IDS } = require('../config/constants');

function resolvePermission(permission) {
  if (typeof permission === 'bigint') {
    return permission;
  }

  return PermissionFlagsBits[permission] || permission;
}

function mapMissingPermissions(permissionNames, permissions) {
  return permissionNames.filter((permissionName) => {
    const permission = resolvePermission(permissionName);
    return !permissions?.has(permission);
  });
}

function isOwnerWhitelisted(userId) {
  return BOT_OWNER_IDS.includes(String(userId || ''));
}

function isGuildOwner(message) {
  return Boolean(message?.guild?.ownerId && message.guild.ownerId === message.author?.id);
}

function hasAutomodOwnerAccess(message) {
  return isOwnerWhitelisted(message?.author?.id) || isGuildOwner(message);
}

function checkCommandAccess(message, command) {
  const meta = command.meta || command;
  const ownerWhitelisted = hasAutomodOwnerAccess(message);

  if (meta.guildOnly && !message.guild) {
    return {
      ok: false,
      key: 'common.errors.guildOnly'
    };
  }

  if (meta.ownerWhitelistOnly && !ownerWhitelisted) {
    return {
      ok: false,
      key: 'common.errors.ownerWhitelistOnly'
    };
  }

  if (meta.permissions?.length && !ownerWhitelisted) {
    const missingUserPermissions = mapMissingPermissions(
      meta.permissions,
      message.member?.permissions
    );

    if (missingUserPermissions.length > 0) {
      return {
        ok: false,
        key: 'common.errors.missingUserPermissions',
        params: {
          permissions: missingUserPermissions.join(', ')
        }
      };
    }
  }

  if (meta.botPermissions?.length && message.guild) {
    const missingBotPermissions = mapMissingPermissions(
      meta.botPermissions,
      message.guild.members.me?.permissions
    );

    if (missingBotPermissions.length > 0) {
      return {
        ok: false,
        key: 'common.errors.missingBotPermissions',
        params: {
          permissions: missingBotPermissions.join(', ')
        }
      };
    }
  }

  return {
    ok: true
  };
}

module.exports = {
  checkCommandAccess,
  isOwnerWhitelisted,
  isGuildOwner,
  hasAutomodOwnerAccess
};
