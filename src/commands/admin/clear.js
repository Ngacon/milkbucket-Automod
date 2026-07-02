const { resolveMember } = require('../../app/command-utils');

function parseClearRequest(args) {
  let limit = null;
  let target = null;

  for (const arg of args) {
    if (/^\d+$/.test(String(arg)) && limit == null) {
      limit = Math.min(Number(arg), 100);
      continue;
    }

    target = arg;
  }

  if (!limit || Number.isNaN(limit)) {
    return null;
  }

  return {
    limit,
    target
  };
}

module.exports = {
  meta: {
    name: 'clear',
    aliases: ['purge'],
    category: 'admin',
    permissions: ['ManageMessages'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 1, max: 2, usage: 'clear [1-100] | clear @user [1-100] | clear bots [1-100]' },
    examples: ['clear 20', 'clear @user 15', 'clear 15 @user', 'clear bots 30'],
    descriptionKey: 'admin.descriptions.clear',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const request = parseClearRequest(args);

    if (!request) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const { limit, target } = request;
    const messages = await message.channel.messages.fetch({ limit: Math.min(limit + 20, 100) });
    let filtered = messages;

    if (String(target || '').toLowerCase() === 'bots') {
      filtered = messages.filter((msg) => msg.author.bot);
    } else if (target) {
      const member = await resolveMember(message, target);
      if (!member) {
        await respond({
          description: t('common.responses.failure')
        });
        return;
      }

      filtered = messages.filter((msg) => msg.author.id === member.id);
    }

    const toDelete = filtered.first(limit);
    const deleted = await message.channel.bulkDelete(toDelete, true);

    await respond({
      description: t('admin.responses.cleared', { count: deleted.size })
    });
  }
};

