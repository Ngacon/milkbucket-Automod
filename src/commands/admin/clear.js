const { resolveMember } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'clear',
    aliases: ['purge'],
    category: 'admin',
    permissions: ['ManageMessages'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 1, max: 2, usage: 'clear [1-100] | clear @user [1-100] | clear bots [1-100]' },
    descriptionKey: 'admin.descriptions.clear',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const targetArg = args[0];
    const limitArg = args[1] || args[0];
    const limit = Math.min(Number(limitArg || 0), 100);

    if (!limit || Number.isNaN(limit)) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const messages = await message.channel.messages.fetch({ limit: Math.min(limit + 1, 100) });
    let filtered = messages;

    if (targetArg === 'bots') {
      filtered = messages.filter((msg) => msg.author.bot);
    } else if (targetArg && targetArg !== limitArg) {
      const member = await resolveMember(message, targetArg);
      if (member) {
        filtered = messages.filter((msg) => msg.author.id === member.id);
      }
    }

    const toDelete = filtered.first(limit);
    const deleted = await message.channel.bulkDelete(toDelete, true);

    await respond({
      description: t('admin.responses.cleared', { count: deleted.size })
    });
  }
};

