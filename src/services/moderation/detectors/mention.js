module.exports = {
  name: 'mention',
  type: 'raid',
  async check(ctx) {
    if (ctx.kind !== 'message' || !ctx.config.enabled || !ctx.config.rules.mention) {
      return null;
    }

    if (!ctx.message || ctx.message.author?.bot || ctx.message.webhookId) {
      return null;
    }

    const mentionCount = ctx.message.mentions.users.size;
    const maxMentions = Number(ctx.config.limits.mentionMax || 0);

    if (!maxMentions || mentionCount <= maxMentions) {
      return null;
    }

    return {
      triggered: true,
      severity: mentionCount >= maxMentions * 2 ? 4 : 3,
      reason: 'Mass mention',
      flags: {
        autowarn: true,
        delete: true,
        escalate: true,
        slowmode: true
      },
      meta: {
        mentionCount,
        slowmodeSeconds: 15
      }
    };
  }
};
