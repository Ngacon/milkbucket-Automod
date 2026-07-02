const { Collection } = require('discord.js');
const { runBatchedOperations } = require('../app/command-utils');
const {
  getReactionEmojiLookupKeys,
  normalizeReactionEmoji
} = require('../app/reaction-role-utils');
const { ROLE_BATCH } = require('../config/constants');

async function resolveGuildRole(guild, roleId) {
  return guild.roles.cache.get(roleId) || guild.roles.fetch(roleId).catch(() => null);
}

async function ensureReactionLoaded(reaction) {
  if (reaction.partial) {
    await reaction.fetch();
  }

  if (reaction.message?.partial) {
    await reaction.message.fetch();
  }

  return reaction;
}

function findReactionOnMessage(targetMessage, emojiInput) {
  const expectedKeys = getReactionEmojiLookupKeys(emojiInput);
  if (expectedKeys.length === 0) {
    return null;
  }

  return (
    targetMessage.reactions.cache.find((reaction) => {
      const candidateKeys = getReactionEmojiLookupKeys(reaction.emoji);
      return expectedKeys.some((key) => candidateKeys.includes(key));
    }) || null
  );
}

async function fetchAllReactionUsers(reaction) {
  const users = new Collection();
  let after = null;

  while (true) {
    const batch = await reaction.users.fetch(
      after
        ? {
            after,
            limit: 100
          }
        : {
            limit: 100
          }
    );

    if (batch.size === 0) {
      break;
    }

    for (const [userId, user] of batch.entries()) {
      users.set(userId, user);
    }

    if (batch.size < 100) {
      break;
    }

    after = batch.lastKey();
    if (!after) {
      break;
    }
  }

  return users;
}

async function syncReactionRoleMembers({ targetMessage, entry, action = 'add', logger }) {
  const role = await resolveGuildRole(targetMessage.guild, entry.role_id);
  if (!role) {
    return {
      ok: false,
      reason: 'roleMissing',
      total: 0,
      changed: 0,
      skipped: 0,
      failed: 0,
      role: null
    };
  }

  const reaction = findReactionOnMessage(targetMessage, entry.emoji);
  if (!reaction) {
    return {
      ok: true,
      missingReaction: true,
      total: 0,
      changed: 0,
      skipped: 0,
      failed: 0,
      role
    };
  }

  const users = await fetchAllReactionUsers(reaction);
  const humanUsers = [...users.values()].filter((user) => !user.bot);
  let changed = 0;
  let skipped = 0;
  let failed = 0;

  await runBatchedOperations(
    humanUsers,
    async (user) => {
      const member = await targetMessage.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        failed += 1;
        return;
      }

      const hasRole = member.roles.cache.has(role.id);

      if (action === 'add') {
        if (hasRole) {
          skipped += 1;
          return;
        }

        const added = await member.roles.add(role).then(() => true).catch((error) => {
          logger?.warn('Failed to add reaction role during sync', {
            error,
            guildId: targetMessage.guild.id,
            messageId: targetMessage.id,
            userId: user.id,
            roleId: role.id
          });
          return false;
        });

        if (added) {
          changed += 1;
          return;
        }

        failed += 1;
        return;
      }

      if (!hasRole) {
        skipped += 1;
        return;
      }

      const removed = await member.roles.remove(role).then(() => true).catch((error) => {
        logger?.warn('Failed to revoke reaction role during sync', {
          error,
          guildId: targetMessage.guild.id,
          messageId: targetMessage.id,
          userId: user.id,
          roleId: role.id
        });
        return false;
      });

      if (removed) {
        changed += 1;
        return;
      }

      failed += 1;
    },
    {
      concurrency: ROLE_BATCH.CONCURRENCY
    }
  );

  return {
    ok: true,
    missingReaction: false,
    total: humanUsers.length,
    changed,
    skipped,
    failed,
    role
  };
}

async function applyReactionRoleAction({ reaction, user, action, reactionRoleRepo, logger }) {
  if (user.bot) {
    return;
  }

  try {
    await ensureReactionLoaded(reaction);

    const normalizedEmoji = normalizeReactionEmoji(reaction.emoji);
    if (!normalizedEmoji) {
      return;
    }

    const entry = await reactionRoleRepo.getByMessageAndEmoji({
      messageId: reaction.message.id,
      emojiValues: getReactionEmojiLookupKeys(reaction.emoji),
      preferredEmoji: normalizedEmoji.key
    });

    if (!entry) {
      return;
    }

    const guild = reaction.message.guild;
    if (!guild) {
      return;
    }

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      logger.warn('Reaction role member not found', {
        guildId: guild.id,
        messageId: reaction.message.id,
        userId: user.id
      });
      return;
    }

    const role = await resolveGuildRole(guild, entry.role_id);
    if (!role) {
      logger.warn('Reaction role mapping points to missing role', {
        guildId: guild.id,
        messageId: reaction.message.id,
        roleId: entry.role_id
      });
      return;
    }

    if (action === 'add') {
      if (member.roles.cache.has(role.id)) {
        return;
      }

      await member.roles.add(role).catch((error) => {
        logger.warn('Reaction role add failed', {
          error,
          guildId: guild.id,
          messageId: reaction.message.id,
          userId: user.id,
          roleId: role.id
        });
      });
      return;
    }

    if (!member.roles.cache.has(role.id)) {
      return;
    }

    await member.roles.remove(role).catch((error) => {
      logger.warn('Reaction role remove failed', {
        error,
        guildId: guild.id,
        messageId: reaction.message.id,
        userId: user.id,
        roleId: role.id
      });
    });
  } catch (error) {
    logger.error('Reaction role event handler failed', {
      error,
      eventAction: action
    });
  }
}

module.exports = {
  findReactionOnMessage,
  fetchAllReactionUsers,
  syncReactionRoleMembers,
  applyReactionRoleAction
};
