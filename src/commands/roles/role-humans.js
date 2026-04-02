const { extractId } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'role-humans',
    aliases: [],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'role-humans @role' },
    descriptionKey: 'roles.descriptions.roleHumans',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const roleId = extractId(args[0]);
    const role = roleId ? message.guild.roles.cache.get(roleId) : null;
    if (!role) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const members = await message.guild.members.fetch();
    let count = 0;
    for (const member of members.values()) {
      if (member.user.bot) {
        continue;
      }
      await member.roles.add(role).catch(() => null);
      count += 1;
    }

    await respond({
      description: t('roles.responses.roleApplied', { count })
    });
  }
};

