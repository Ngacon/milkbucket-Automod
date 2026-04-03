const { resolveMember, resolveRole } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'role-add',
    aliases: ['roleadd'],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldown: 2,
    args: { min: 2, max: 2, usage: 'role-add @user @role' },
    examples: ['role add @user @role', 'role add @user Member'],
    descriptionKey: 'roles.descriptions.roleAdd',
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

    await member.roles.add(role);
    await respond({
      author: {
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ size: 128 })
      },
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      description: t('roles.responses.roleAdded', {
        role: role.name,
        user: member.user.tag
      })
    });
  }
};

