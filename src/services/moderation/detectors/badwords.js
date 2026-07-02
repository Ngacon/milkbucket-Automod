module.exports = {
  name: 'badwords',
  type: 'automod',
  async check(ctx) {
    if (ctx.kind !== 'message' || !ctx.config.enabled || !ctx.config.rules.badwords) {
      return null;
    }

    if (!ctx.message || ctx.message.author?.bot || ctx.message.webhookId) {
      return null;
    }

    const words = await ctx.getBadwords();
    if (words.length === 0) {
      return null;
    }

    const lowered = (ctx.message.content || '').toLowerCase();
    const match = words.find((word) => lowered.includes(word.toLowerCase()));

    if (!match) {
      return null;
    }

    return {
      triggered: true,
      severity: 3,
      reason: 'Chửi thề',
      flags: {
        autowarn: true,
        delete: true,
        escalate: true
      },
      meta: {
        match
      }
    };
  }
};
