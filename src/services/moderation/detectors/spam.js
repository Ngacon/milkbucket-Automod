module.exports = {
  name: 'spam',
  type: 'automod',
  async check(ctx) {
    if (ctx.kind !== 'message' || !ctx.config.enabled || !ctx.config.rules.spam) {
      return null;
    }

    if (!ctx.message || ctx.message.author?.bot || ctx.message.webhookId) {
      return null;
    }

    const cacheKey = `mod:spam:${ctx.guild.id}:${ctx.user.id}`;
    const count = await ctx.redis.incr(cacheKey);
    if (count === 1) {
      await ctx.redis.expire(cacheKey, 8);
    }

    if (count < 6) {
      return null;
    }

    return {
      triggered: true,
      severity: 2,
      reason: 'Spam tin nhắn',
      flags: {
        autowarn: true,
        delete: true,
        escalate: true
      },
      meta: {
        count
      }
    };
  }
};
