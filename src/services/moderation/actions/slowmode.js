async function slowmode(ctx, payload = {}) {
  if (!ctx.message?.channel || typeof ctx.message.channel.setRateLimitPerUser !== 'function') {
    return false;
  }

  const seconds = Math.max(0, Math.min(Number(payload.seconds || 10), 21600));
  await ctx.message.channel.setRateLimitPerUser(seconds);
  return true;
}

module.exports = slowmode;
