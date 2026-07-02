const { JAIL_ROLE_ID } = require('../../config/constants');
const { PermissionFlagsBits } = require('discord.js');

const DANGEROUS_PERMISSIONS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ModerateMembers
];

function shouldRemoveRole(existingRole, jailRole, guildId) {
  if (!existingRole || existingRole.id === jailRole.id || existingRole.id === guildId) {
    return false;
  }

  if (existingRole.managed) {
    return false;
  }

  if (DANGEROUS_PERMISSIONS.some((permission) => existingRole.permissions.has(permission))) {
    return true;
  }

  return existingRole.position >= jailRole.position;
}

async function jailMember(ctx, payload = {}) {
  if (!ctx.guild || !ctx.member) {
    return false;
  }

  const jailRole = ctx.guild.roles.cache.get(JAIL_ROLE_ID);
  if (!jailRole) {
    return false;
  }

  await ctx.member.roles.add(jailRole, payload.reason || 'AutoMod jail action').catch(() => null);

  const elevatedRoles = ctx.member.roles.cache.filter((role) =>
    shouldRemoveRole(role, jailRole, ctx.guild.id)
  );

  await Promise.all(
    elevatedRoles.map((role) =>
      ctx.member.roles.remove(role, 'Removed elevated role while jailing member').catch(() => null)
    )
  );

  if (payload.duration != null) {
    const durationMs = Number(payload.duration || 0) * 1000;
    if (durationMs > 0 && ctx.member.moderatable) {
      await ctx.member.timeout(durationMs, payload.reason || undefined).catch(() => null);
    }
  }

  return true;
}

module.exports = jailMember;
