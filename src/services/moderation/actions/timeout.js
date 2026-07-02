async function timeoutMember(ctx, payload = {}) {
  if (!ctx.member?.moderatable) {
    return false;
  }

  const durationMs = Number(payload.duration || 0) * 1000;
  if (!durationMs) {
    return false;
  }

  await ctx.member.timeout(durationMs, payload.reason || undefined);
  return true;
}

module.exports = timeoutMember;
