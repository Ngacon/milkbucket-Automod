module.exports = {
  name: 'bot-add',
  type: 'raid',
  async check(ctx) {
    if (ctx.kind !== 'memberAdd' || !ctx.config.enabled || !ctx.config.rules.botRaid) {
      return null;
    }

    if (!ctx.member?.user?.bot) {
      return null;
    }

    return {
      triggered: true,
      severity: 4,
      reason: 'Bot raid detected',
      flags: {
        autowarn: false,
        escalate: false,
        kick: true
      },
      meta: {}
    };
  }
};
