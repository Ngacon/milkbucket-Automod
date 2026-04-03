const { resolveMember, resolveRole } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'role-remove',
    aliases: ['roleremove'],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldown: 2,
    args: { min: 2, max: 2, usage: 'role-remove @user @role' },
    examples: ['role remove @user @role', 'role remove @user Member'],
    descriptionKey: 'roles.descriptions.roleRemove',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const member = await resolveMember(message, args[0]);
    const role = resolveRole(message, args[1]);

    if (!member || !role) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    await member.roles.remove(role);
    await respond({
      author: {
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ size: 128 })
      },
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      description: t('roles.responses.roleRemoved', {
        role: role.name,
        user: member.user.tag
      })
    });
  }
};

