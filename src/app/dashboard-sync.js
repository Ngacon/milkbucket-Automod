async function syncGuild(pool, guild) {
  try {
    await pool.query(`
      INSERT INTO "Guild" (id, name, "ownerId", "memberCount", "channelCount", "roleCount")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        "ownerId" = EXCLUDED."ownerId",
        "memberCount" = EXCLUDED."memberCount",
        "channelCount" = EXCLUDED."channelCount",
        "roleCount" = EXCLUDED."roleCount"
    `, [
      guild.id, guild.name, guild.ownerId,
      guild.memberCount || 0,
      guild.channels?.cache?.size || 0,
      guild.roles?.cache?.size || 0
    ]);
  } catch (err) {
    // silent
  }
}

async function syncMember(pool, member) {
  try {
    await pool.query(`
      INSERT INTO "Member" (id, "guildId", username, "displayName", "avatarUrl", bot, "joinedAt", roles)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id, "guildId") DO UPDATE SET
        username = EXCLUDED.username,
        "displayName" = EXCLUDED."displayName",
        "avatarUrl" = EXCLUDED."avatarUrl",
        roles = EXCLUDED.roles
    `, [
      member.id, member.guild.id,
      member.user?.username || 'unknown',
      member.displayName || null,
      member.user?.displayAvatarURL?.() || null,
      member.user?.bot || false,
      member.joinedAt || new Date(),
      JSON.stringify([...member.roles?.cache?.keys() || []])
    ]);
  } catch (err) {
    // silent
  }
}

async function syncWarning(pool, { guildId, userId, moderatorId, reason }) {
  try {
    await pool.query(`
      INSERT INTO "dashboard_warnings" ("guildId", "userId", "moderatorId", reason)
      VALUES ($1, $2, $3, $4)
    `, [guildId, userId, moderatorId, reason || null]);
  } catch (err) {
    // silent
  }
}

async function syncCommandLog(pool, { guildId, commandName, category, userId, username, args, success, durationMs }) {
  try {
    await pool.query(`
      INSERT INTO "CommandLog" ("guildId", "commandName", category, "userId", username, args, success, "durationMs")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [guildId, commandName, category, userId, username, args || '', success !== false, durationMs || 0]);
  } catch (err) {
    // silent
  }
}

async function syncAutoModEvent(pool, { guildId, feature, userId, username, action, content }) {
  try {
    await pool.query(`
      INSERT INTO "AutoModEvent" ("guildId", feature, "userId", username, action, content)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [guildId, feature, userId, username, action, content || '']);
  } catch (err) {
    // silent
  }
}

async function syncBadWord(pool, { guildId, word, severity }) {
  try {
    await pool.query(`
      INSERT INTO "dashboard_badwords" ("guildId", word, severity)
      VALUES ($1, $2, $3)
      ON CONFLICT ("guildId", word) DO NOTHING
    `, [guildId, word.toLowerCase(), severity || 'medium']);
  } catch (err) {
    // silent
  }
}

async function removeBadWord(pool, { guildId, word }) {
  try {
    await pool.query(`
      DELETE FROM "dashboard_badwords" WHERE "guildId" = $1 AND word = $2
    `, [guildId, word.toLowerCase()]);
  } catch (err) {
    // silent
  }
}

async function syncReactionRole(pool, { guildId, channelId, messageId, emoji, roleId }) {
  try {
    await pool.query(`
      INSERT INTO "dashboard_reaction_roles" ("guildId", "messageId", "channelId", emoji, "roleId", "roleName")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, [guildId, messageId, channelId, emoji, roleId, '']);
  } catch (err) {
    // silent
  }
}

async function removeReactionRole(pool, { messageId, emoji }) {
  try {
    await pool.query(`
      DELETE FROM "dashboard_reaction_roles" WHERE "messageId" = $1 AND emoji = $2
    `, [messageId, emoji]);
  } catch (err) {
    // silent
  }
}

async function syncMute(pool, { guildId, userId, moderatorId, reason, duration, expiresAt }) {
  try {
    await pool.query(`
      INSERT INTO "Mute" ("guildId", "userId", "moderatorId", reason, duration, active, "expiresAt")
      VALUES ($1, $2, $3, $4, $5, TRUE, $6)
    `, [guildId, userId, moderatorId, reason, duration || 0, expiresAt || null]);
  } catch (err) {
    // silent
  }
}

async function syncBan(pool, { guildId, userId, moderatorId, reason, soft, hackban }) {
  try {
    await pool.query(`
      INSERT INTO "Ban" ("guildId", "userId", "moderatorId", reason, soft, hackban)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [guildId, userId, moderatorId, reason, soft || false, hackban || false]);
  } catch (err) {
    // silent
  }
}

async function syncAutoModConfig(pool, { guildId, feature, enabled, threshold, action, warnLimit }) {
  try {
    await pool.query(`
      INSERT INTO "AutoModConfig" ("guildId", feature, enabled, threshold, action, "warnLimit")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT ("guildId", feature) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        threshold = EXCLUDED.threshold,
        action = EXCLUDED.action,
        "warnLimit" = EXCLUDED."warnLimit"
    `, [guildId, feature, enabled !== false, threshold || 0, action || 'warn', warnLimit || 3]);
  } catch (err) {
    // silent
  }
}

module.exports = {
  syncGuild,
  syncMember,
  syncWarning,
  syncCommandLog,
  syncAutoModEvent,
  syncBadWord,
  removeBadWord,
  syncReactionRole,
  removeReactionRole,
  syncMute,
  syncBan,
  syncAutoModConfig
};
