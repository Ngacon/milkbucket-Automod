const {
  resolveMember,
  resolveRole,
  canActOnRole,
  canActOnMember
} = require('../../app/command-utils');
const { EMBED_COLORS } = require('../../config/constants');

module.exports = {
  meta: {
    name: 'role-remove',
    aliases: ['roleremove'],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldown: 2,
    args: { min: 2, max: 20, usage: 'role-remove @user @role' },
    examples: ['role remove @user @role', 'role remove @user Member'],
    descriptionKey: 'roles.descriptions.roleRemove',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const member = await resolveMember(message, args[0]);
    const role = resolveRole(message, args.slice(1).join(' '));

    if (!member || !role) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const roleAccess = canActOnRole(message, role);
    if (!roleAccess.ok) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: t(`roles.responses.${roleAccess.reason}`, {
          role: role.name
        })
      });
      return;
    }

    if (!canActOnMember(message, member)) {
      await respond({
        color: EMBED_COLORS.ERROR,
        description: t('roles.responses.memberAboveUser', {
          user: member.user.tag
        })
      });
      return;
    }

    if (!member.roles.cache.has(role.id)) {
      await respond({
        color: EMBED_COLORS.WARNING,
        description: t('roles.responses.roleNotAssigned', {
          role: role.name,
          user: member.user.tag
        })
      });
      return;
    }

    await member.roles.remove(role);
    await respond({
      color: EMBED_COLORS.ACCENT,
      title: t('roles.responses.roleRemoveTitle'),
      author: {
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ size: 128 })
      },
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      description: t('roles.responses.roleRemoved', {
        role: role.name,
        user: member.user.tag
      }),
      fields: [
        {
          name: t('roles.labels.member'),
          value: `${member.user.tag}\n\`${member.id}\``,
          inline: true
        },
        {
          name: t('roles.labels.role'),
          value: `${role}\n\`${role.id}\``,
          inline: true
        }
      ]
    });
  }
};
