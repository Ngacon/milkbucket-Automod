module.exports = {
  meta: {
    name: 'ping',
    aliases: ['latency'],
    category: 'system',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'ping' },
    descriptionKey: 'system.descriptions.ping',
    guildOnly: false
  },
  async execute({ client, message, respond, t }) {
    const messageLatency = Date.now() - message.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    await respond({
      title: t('commands.ping.successTitle'),
      description: t('commands.ping.successDescription'),
      fields: [
        {
          name: t('common.labels.latency'),
          value: `${messageLatency}ms`,
          inline: true
        },
        {
          name: t('common.labels.websocket'),
          value: `${apiLatency}ms`,
          inline: true
        }
      ]
    });
  }
};

