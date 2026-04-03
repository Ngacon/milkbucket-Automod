function countCapsRatio(content) {
  const letters = String(content || '').replace(/[^a-zA-Z]/g, '');
  if (letters.length < 12) {
    return 0;
  }

  const caps = letters.replace(/[^A-Z]/g, '').length;
  return caps / letters.length;
}

module.exports = {
  name: 'caps',
  type: 'automod',
  async check(ctx) {
    if (ctx.kind !== 'message' || !ctx.config.enabled || !ctx.config.rules.caps) {
      return null;
    }

    if (!ctx.message || ctx.message.author?.bot || ctx.message.webhookId) {
      return null;
    }

    const ratio = countCapsRatio(ctx.message.content);
    if (ratio < 0.75) {
      return null;
    }

    return {
      triggered: true,
      severity: 1,
      reason: 'Viết hoa quá nhiều',
      flags: {
        autowarn: true,
        delete: true,
        escalate: true
      },
      meta: {
        ratio
      }
    };
  }
};
