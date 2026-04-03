const INVITE_REGEX = /(discord\.gg|discord\.com\/invite)\//i;

module.exports = {
  name: 'invite',
  type: 'automod',
  async check(ctx) {
    if (ctx.kind !== 'message' || !ctx.config.enabled || !ctx.config.rules.invite) {
      return null;
    }

    if (!ctx.message || ctx.message.author?.bot || ctx.message.webhookId) {
      return null;
    }

    if (!INVITE_REGEX.test(ctx.message.content || '')) {
      return null;
    }

    return {
      triggered: true,
      severity: 3,
      reason: 'Gửi link mời server khác',
      flags: {
        autowarn: true,
        delete: true,
        escalate: true
      },
      meta: {}
    };
  }
};
