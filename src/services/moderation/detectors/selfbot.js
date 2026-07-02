function looksAutomated(content) {
  return /^(?:[./;$,!-]|pls |owo |uwu |selfbot )/i.test(String(content || '').trim());
}

module.exports = {
  name: 'selfbot',
  type: 'raid',
  async check(ctx) {
    if (ctx.kind !== 'message' || !ctx.config.enabled || !ctx.config.rules.selfbot) {
      return null;
    }

    if (!ctx.message || ctx.message.author?.bot || ctx.message.webhookId) {
      return null;
    }

    if (!looksAutomated(ctx.message.content)) {
      return null;
    }

    const cacheKey = `mod:selfbot:${ctx.guild.id}:${ctx.user.id}`;
    const count = await ctx.redis.incr(cacheKey);
    if (count === 1) {
      await ctx.redis.expire(cacheKey, 8);
    }

    if (count < 10) {
      return null;
    }

    return {
      triggered: true,
      severity: 5,
      reason: 'Hành vi selfbot',
      flags: {
        autowarn: true,
        delete: true,
        escalate: false,
        instantBan: true
      },
      meta: {
        count
      }
    };
  }
};
