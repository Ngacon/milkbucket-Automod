const { resolveRole } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'role-humans',
    aliases: [],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'role-humans @role' },
    examples: ['role humans @role', 'role humans Member'],
    descriptionKey: 'roles.descriptions.roleHumans',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const role = resolveRole(message, args[0]);
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
      const added = await member.roles.add(role).then(() => true).catch(() => false);
      if (added) {
        count += 1;
      }
    }

    await respond({
      description: t('roles.responses.roleApplied', { count })
    });
  }
};

