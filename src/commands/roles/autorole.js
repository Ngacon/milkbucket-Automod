const { resolveRole } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'autorole',
    aliases: [],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldown: 2,
    args: { min: 1, max: 1, usage: 'autorole @role' },
    examples: ['autorole @role', 'autorole Member'],
    descriptionKey: 'roles.descriptions.autorole',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const role = resolveRole(message, args[0]);
    if (!role) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    await repos.autoroleRepo.setRole(message.guild.id, role.id);
    await respond({
      description: t('roles.responses.autoroleSet', { role: role.name })
    });
  }
};

