module.exports = {
  name: 'duplicate',
  type: 'automod',
  async check(ctx) {
    if (ctx.kind !== 'message' || !ctx.config.enabled || !ctx.config.rules.duplicate) {
      return null;
    }

    if (!ctx.message || ctx.message.author?.bot || ctx.message.webhookId) {
      return null;
    }

    const cacheKey = `mod:duplicate:${ctx.guild.id}:${ctx.user.id}`;
    const lastMessage = await ctx.redis.get(cacheKey);
    const content = ctx.message.content || '';
    await ctx.redis.set(cacheKey, content, 'EX', 20);

    if (!lastMessage || lastMessage !== content || content.length < 3) {
      return null;
    }

    return {
      triggered: true,
      severity: 2,
      reason: 'Gửi tin nhắn trùng lặp',
      flags: {
        autowarn: true,
        delete: true,
        escalate: true
      },
      meta: {}
    };
  }
};
