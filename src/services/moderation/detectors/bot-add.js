const { AuditLogEvent } = require('discord.js');

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

    const logs = await ctx.guild.fetchAuditLogs({
      type: AuditLogEvent.BotAdd,
      limit: 5
    }).catch((error) => {
      ctx.logger?.warn('Unable to read bot-add audit log', {
        error,
        guildId: ctx.guild.id,
        botId: ctx.member.id
      });
      return null;
    });
    const entry = logs?.entries.find(
      (item) =>
        item.target?.id === ctx.member.id &&
        Date.now() - item.createdTimestamp < 30_000
    );
    const inviterId = entry?.executor?.id || null;

    if (
      inviterId &&
      (await ctx.isPrivilegedAutomodUser(inviterId))
    ) {
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
      meta: {
        inviterId
      }
    };
  }
};
