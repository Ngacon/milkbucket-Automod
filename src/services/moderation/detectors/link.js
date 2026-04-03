const LINK_REGEX = /(https?:\/\/|www\.)/i;

module.exports = {
  name: 'link',
  type: 'automod',
  async check(ctx) {
    if (ctx.kind !== 'message' || !ctx.config.enabled || !ctx.config.rules.link) {
      return null;
    }

    if (!ctx.message || ctx.message.author?.bot || ctx.message.webhookId) {
      return null;
    }

    if (!LINK_REGEX.test(ctx.message.content || '')) {
      return null;
    }

    return {
      triggered: true,
      severity: 2,
      reason: 'Gửi link',
      flags: {
        autowarn: true,
        delete: true,
        escalate: true
      },
      meta: {}
    };
  }
};
