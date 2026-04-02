const { resolveMember, extractId } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'role-remove',
    aliases: ['roleremove'],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldown: 2,
    args: { min: 2, max: 2, usage: 'role-remove @user @role' },
    descriptionKey: 'roles.descriptions.roleRemove',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const member = await resolveMember(message, args[0]);
    const roleId = extractId(args[1]);
    const role = roleId ? message.guild.roles.cache.get(roleId) : null;

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

