module.exports = {
  name: 'webhook-spam',
  type: 'raid',
  async check(ctx) {
    if (ctx.kind !== 'message' || !ctx.config.enabled || !ctx.config.rules.webhook) {
      return null;
    }

    if (!ctx.message?.webhookId) {
      return null;
    }

    const cacheKey = `mod:webhook:${ctx.guild.id}:${ctx.message.channelId}:${ctx.message.webhookId}`;
    const count = await ctx.redis.incr(cacheKey);
    if (count === 1) {
      await ctx.redis.expire(cacheKey, 8);
    }

    if (count < 3) {
      return null;
    }

    return {
      triggered: true,
      severity: 4,
      reason: 'Webhook spam',
      flags: {
        autowarn: false,
        delete: true,
        deleteWebhooks: true,
        escalate: false
      },
      meta: {
        count
      }
    };
  }
};
