async function kickMember(ctx, payload = {}) {
  if (!ctx.member?.kickable) {
    return false;
  }

  await ctx.member.kick(payload.reason || undefined);
  return true;
}

module.exports = kickMember;
