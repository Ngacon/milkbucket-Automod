const REPEAT_THRESHOLD = 5;

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

    if (Array.isArray(ctx.config?.spamAllowedChannelIds) && ctx.config.spamAllowedChannelIds.includes(ctx.message.channelId)) {
      return null;
    }

    const content = String(ctx.message.content || '').trim();
    if (content.length < 3) {
      return null;
    }

    const cacheKey = `mod:duplicate:${ctx.guild.id}:${ctx.user.id}`;
    const stored = await ctx.redis.get(cacheKey);
    const [storedContent, storedCountText] = stored ? stored.split('|', 2) : [null, null];
    const storedCount = Number(storedCountText) || 0;

    if (storedContent === content) {
      const nextCount = storedCount + 1;
      await ctx.redis.set(cacheKey, `${content}|${nextCount}`, 'EX', 20);

      if (nextCount >= REPEAT_THRESHOLD) {
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

      return null;
    }

    await ctx.redis.set(cacheKey, `${content}|1`, 'EX', 20);
    return null;
  }
};
