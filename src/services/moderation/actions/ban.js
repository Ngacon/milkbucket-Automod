async function banMember(ctx, payload = {}) {
  if (ctx.member?.bannable) {
    await ctx.member.ban({ reason: payload.reason || undefined });
    return true;
  }

  if (!ctx.guild || !ctx.user?.id) {
    return false;
  }

  await ctx.guild.members.ban(ctx.user.id, {
    reason: payload.reason || undefined
  });

  return true;
}

module.exports = banMember;
