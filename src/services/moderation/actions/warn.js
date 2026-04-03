async function warn(ctx, payload) {
  const warning = await ctx.repos.warningsRepo.addWarning({
    guildId: ctx.guild.id,
    userId: ctx.user.id,
    moderatorId: ctx.client.user.id,
    reason: payload.reason
  });

  const warnCount = await ctx.repos.warningsRepo.countWarningsWithinWindow({
    guildId: ctx.guild.id,
    userId: ctx.user.id,
    timeWindowSeconds: ctx.config.timeWindow
  });

  return {
    id: warning.id,
    reason: payload.reason,
    source: payload.source,
    warnCount
  };
}

module.exports = warn;
