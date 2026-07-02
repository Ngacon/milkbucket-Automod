const { formatDuration } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'uptime',
    aliases: [],
    category: 'info',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 0, max: 0, usage: 'uptime' },
    descriptionKey: 'info.descriptions.uptime',
    guildOnly: false
  },
  async execute({ respond }) {
    const uptime = formatDuration(process.uptime() * 1000);
    await respond({
      description: uptime
    });
  }
};

