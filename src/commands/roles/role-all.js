const {
  resolveRole,
  canActOnRole,
  canActOnMember,
  runBatchedOperations
} = require('../../app/command-utils');
const { EMBED_COLORS, ROLE_BATCH } = require('../../config/constants');

async function applyRoleToMembers({ members, role, message }) {
  const startedAt = Date.now();
  let success = 0;
  let skipped = 0;
  let failed = 0;

  await runBatchedOperations(
    members,
    async (member) => {
      if (!canActOnMember(message, member) || member.roles.cache.has(role.id)) {
        skipped += 1;
        return;
      }

      const added = await member.roles.add(role).then(() => true).catch(() => false);

      if (added) {
        success += 1;
        return;
      }

      failed += 1;
    },
    {
      concurrency: ROLE_BATCH.CONCURRENCY
    }
  );

  return {
    success,
    skipped,
    failed,
    durationMs: Date.now() - startedAt
  };
}

module.exports = {
  meta: {
    name: 'role-all',
    aliases: [],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldown: 2,
    args: { min: 1, max: 20, usage: 'role-all @role' },
    examples: ['role all @role', 'role all Member'],
    descriptionKey: 'roles.descriptions.roleAll',
    guildOnly: true
  },
  async execute({ message, args, t, respond }) {
    const role = resolveRole(message, args.join(' '));
    if (!role) {
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

    const members = await message.guild.members.fetch();
    const result = await applyRoleToMembers({
      members: [...members.values()],
      role,
      message
    });

    await respond({
      color: EMBED_COLORS.ACCENT,
      title: t('roles.responses.roleBatchTitle'),
      description: t('roles.responses.roleBatchApplied', {
        role: role.name,
        count: result.success
      }),
      fields: [
        {
          name: t('roles.labels.role'),
          value: `${role}\n\`${role.id}\``,
          inline: true
        },
        {
          name: t('roles.labels.scope'),
          value: t('roles.labels.everyone'),
          inline: true
        },
        {
          name: t('roles.labels.processed'),
          value: String(members.size),
          inline: true
        },
        {
          name: t('roles.labels.added'),
          value: String(result.success),
          inline: true
        },
        {
          name: t('roles.labels.skipped'),
          value: String(result.skipped),
          inline: true
        },
        {
          name: t('roles.labels.failed'),
          value: String(result.failed),
          inline: true
        },
        {
          name: t('roles.labels.duration'),
          value: `${result.durationMs}ms`,
          inline: false
        }
      ]
    });
  }
};
