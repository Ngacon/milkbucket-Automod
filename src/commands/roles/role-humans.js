const {
  resolveRole,
  canActOnRole,
  canActOnMember,
  runBatchedOperations
} = require('../../app/command-utils');
const { EMBED_COLORS, ROLE_BATCH } = require('../../config/constants');

module.exports = {
  meta: {
    name: 'role-humans',
    aliases: [],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldown: 2,
    args: { min: 1, max: 20, usage: 'role-humans @role' },
    examples: ['role humans @role', 'role humans Member'],
    descriptionKey: 'roles.descriptions.roleHumans',
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
    const targets = [...members.values()].filter((member) => !member.user.bot);
    let success = 0;
    let skipped = 0;
    let failed = 0;
    const startedAt = Date.now();

    await runBatchedOperations(
      targets,
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

    await respond({
      color: EMBED_COLORS.ACCENT,
      title: t('roles.responses.roleBatchTitle'),
      description: t('roles.responses.roleBatchApplied', {
        role: role.name,
        count: success
      }),
      fields: [
        {
          name: t('roles.labels.role'),
          value: `${role}\n\`${role.id}\``,
          inline: true
        },
        {
          name: t('roles.labels.scope'),
          value: t('roles.labels.humans'),
          inline: true
        },
        {
          name: t('roles.labels.processed'),
          value: String(targets.length),
          inline: true
        },
        {
          name: t('roles.labels.added'),
          value: String(success),
          inline: true
        },
        {
          name: t('roles.labels.skipped'),
          value: String(skipped),
          inline: true
        },
        {
          name: t('roles.labels.failed'),
          value: String(failed),
          inline: true
        },
        {
          name: t('roles.labels.duration'),
          value: `${Date.now() - startedAt}ms`,
          inline: false
        }
      ]
    });
  }
};
