const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const {
  getUniqueCommands,
  groupCommandsByCategory,
  resolveCommand,
  normalizeCommandKey,
  formatCommandLabel
} = require('../../app/command-registry');

const HOME_VIEW = 'home';
const CATEGORY_ORDER = [
  'system',
  'moderation',
  'automod',
  'admin',
  'roles',
  'channels',
  'utility',
  'info',
  'fun'
];

function formatUsage(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPermission(permission) {
  return String(permission || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

function chunkLines(lines, maxLength = 900) {
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const line of lines) {
    if (currentLength + line.length + 1 > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
      currentChunk = [];
      currentLength = 0;
    }

    currentChunk.push(line);
    currentLength += line.length + 1;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  return chunks;
}

function sortCategories(groupedCommands) {
  const categories = Object.keys(groupedCommands);

  return categories.sort((left, right) => {
    const leftIndex = CATEGORY_ORDER.indexOf(left);
    const rightIndex = CATEGORY_ORDER.indexOf(right);

    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right);
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

function buildCategoryMenu(categories, activeView, t) {
  return new StringSelectMenuBuilder()
    .setCustomId('help:category')
    .setPlaceholder(t('system.labels.selectCategory'))
    .addOptions(
      [HOME_VIEW, ...categories].map((category) => ({
        label: t(`system.categories.${category}`),
        value: category,
        default: category === activeView
      }))
    );
}

function buildHomeEmbed({ buildEmbed, colors, t, prefix, totalCommands, categories, groupedCommands, botUser }) {
  const categoryLines = categories.map((category) => {
    const count = groupedCommands[category]?.length || 0;
    return `- ${t(`system.categories.${category}`)}: ${count}`;
  });

  return buildEmbed({
    color: colors.PRIMARY,
    title: t('system.responses.helpTitle'),
    description: [
      t('system.responses.helpHomeSummary', {
        total: totalCommands,
        categories: categories.length
      }),
      t('system.responses.helpSidebarHint')
    ].join('\n'),
    author: botUser
      ? {
          name: t('system.categories.home'),
          iconURL: botUser.displayAvatarURL({ size: 128 })
        }
      : undefined,
    thumbnail: botUser?.displayAvatarURL({ size: 256 }),
    fields: [
      {
        name: t('system.labels.quickStart'),
        value: [
          `\`${prefix}help\` - ${t('system.responses.helpOpenOverview')}`,
          `\`${prefix}help ban\` - ${t('system.responses.helpOpenCommand')}`,
          `\`${prefix}help role add\` - ${t('system.responses.helpOpenNestedCommand')}`,
          `\`${prefix}automod status\` - ${t('system.responses.helpRunExample')}`
        ].join('\n'),
        inline: false
      },
      {
        name: t('system.labels.categories'),
        value: categoryLines.join('\n'),
        inline: false
      }
    ]
  });
}

function buildCategoryEmbed({ buildEmbed, colors, t, prefix, category, commands, totalCommands, botUser }) {
  const categoryLabel = t(`system.categories.${category}`);
  const commandLines = commands.map((command) => {
    const description = t(command.meta.descriptionKey || 'system.responses.noDescription');
    return `- \`${prefix}${formatCommandLabel(command.meta.name)}\` - ${description}`;
  });

  const fields = chunkLines(commandLines).map((value, index) => ({
    name:
      index === 0
        ? t('system.responses.helpCategory', {
            category: categoryLabel
          })
        : `${categoryLabel} ${index + 1}`,
    value,
    inline: false
  }));

  return buildEmbed({
    color: colors.PRIMARY,
    title: t('system.responses.helpTitle'),
    description: t('system.responses.helpCategorySummary', {
      total: totalCommands,
      category: categoryLabel,
      count: commands.length
    }),
    author: botUser
      ? {
          name: categoryLabel,
          iconURL: botUser.displayAvatarURL({ size: 128 })
        }
      : undefined,
    thumbnail: botUser?.displayAvatarURL({ size: 256 }),
    fields
  });
}

function buildDetailEmbed({ buildEmbed, colors, t, prefix, command, relatedCommands, botUser }) {
  const { meta } = command;
  const commandLabel = formatCommandLabel(meta.name);
  const usage = meta.args?.usage
    ? `\`${prefix}${formatUsage(meta.args.usage)}\``
    : `\`${prefix}${commandLabel}\``;
  const aliases = meta.aliases?.length
    ? meta.aliases.map((alias) => `\`${prefix}${formatCommandLabel(alias)}\``).join(', ')
    : t('system.labels.none');
  const permissions = meta.permissions?.length
    ? meta.permissions.map(formatPermission).join(', ')
    : t('system.labels.none');
  const examples = meta.examples?.length
    ? meta.examples.map((example) => `\`${prefix}${formatUsage(example)}\``)
    : [`\`${prefix}${formatUsage(meta.args?.usage || meta.name)}\``];

  return buildEmbed({
    color: colors.PRIMARY,
    title: `${prefix}${commandLabel}`,
    description: t(meta.descriptionKey || 'system.responses.noDescription'),
    author: botUser
      ? {
          name: t('system.responses.helpCategory', {
            category: t(`system.categories.${meta.category || 'system'}`)
          }),
          iconURL: botUser.displayAvatarURL({ size: 128 })
        }
      : undefined,
    thumbnail: botUser?.displayAvatarURL({ size: 256 }),
    fields: [
      {
        name: t('system.labels.usage'),
        value: usage,
        inline: false
      },
      {
        name: t('system.labels.aliases'),
        value: aliases,
        inline: false
      },
      {
        name: t('system.labels.category'),
        value: t(`system.categories.${meta.category || 'system'}`),
        inline: true
      },
      {
        name: t('system.labels.cooldown'),
        value: meta.cooldown ? `${meta.cooldown}s` : '0s',
        inline: true
      },
      {
        name: t('system.labels.permissions'),
        value: permissions,
        inline: false
      },
      {
        name: t('system.labels.examples'),
        value: examples.join('\n'),
        inline: false
      },
      {
        name: t('system.labels.relatedCommands'),
        value:
          relatedCommands.length > 0
            ? relatedCommands
                .map((relatedCommand) => `\`${prefix}${formatCommandLabel(relatedCommand.meta.name)}\``)
                .join(', ')
            : t('system.labels.none'),
        inline: false
      }
    ]
  });
}

module.exports = {
  meta: {
    name: 'help',
    aliases: ['commands'],
    category: 'system',
    permissions: [],
    botPermissions: [],
    cooldown: 2,
    args: { min: 0, max: 8, usage: 'help [command]' },
    descriptionKey: 'system.descriptions.help',
    guildOnly: false
  },
  async execute({ args, registry, t, reply, buildEmbed, colors, message, prefix }) {
    const uniqueCommands = getUniqueCommands(registry);
    const groupedCommands = groupCommandsByCategory(uniqueCommands);
    const categories = sortCategories(groupedCommands);
    const botUser = message.client.user || null;

    const getCategoryCommands = (categoryKey) =>
      (groupedCommands[categoryKey] || []).sort((left, right) =>
        formatCommandLabel(left.meta.name).localeCompare(formatCommandLabel(right.meta.name))
      );

    const buildRows = (activeView) => [
      new ActionRowBuilder().addComponents(buildCategoryMenu(categories, activeView, t))
    ];

    const renderOverview = (activeView) => {
      if (activeView === HOME_VIEW) {
        return buildHomeEmbed({
          buildEmbed,
          colors,
          t,
          prefix,
          totalCommands: uniqueCommands.length,
          categories,
          groupedCommands,
          botUser
        });
      }

      return buildCategoryEmbed({
        buildEmbed,
        colors,
        t,
        prefix,
        category: activeView,
        commands: getCategoryCommands(activeView),
        totalCommands: uniqueCommands.length,
        botUser
      });
    };

    const query = args.join(' ').trim();
    const queriedCommand = query
      ? resolveCommand(registry, query.split(/\s+/))?.command ||
        registry.get(normalizeCommandKey(query)) ||
        null
      : null;

    if (query && !queriedCommand) {
      await reply({
        embeds: [
          buildEmbed({
            color: colors.ERROR,
            description: t('common.errors.commandNotFound', {
              command: normalizeCommandKey(query)
            })
          })
        ]
      });
      return;
    }

    const activeView = queriedCommand?.meta.category || HOME_VIEW;
    const sent = await reply({
      embeds: [
        queriedCommand
          ? buildDetailEmbed({
              buildEmbed,
              colors,
              t,
              prefix,
              command: queriedCommand,
              relatedCommands: getCategoryCommands(queriedCommand.meta.category || 'system')
                .filter((command) => command.meta.name !== queriedCommand.meta.name)
                .slice(0, 6),
              botUser
            })
          : renderOverview(activeView)
      ],
      components: buildRows(activeView)
    });

    if (!sent) {
      return;
    }

    let currentView = activeView;
    const collector = sent.createMessageComponentCollector({
      time: 5 * 60 * 1000
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        await interaction.reply({
          content: t('system.responses.helpLocked'),
          ephemeral: true
        });
        return;
      }

      if (interaction.customId !== 'help:category') {
        return;
      }

      currentView = interaction.values[0];
      await interaction.update({
        embeds: [renderOverview(currentView)],
        components: buildRows(currentView)
      });
    });

    collector.on('end', async () => {
      try {
        const rows = buildRows(currentView);
        rows[0].components[0].setDisabled(true);
        await sent.edit({ components: rows });
      } catch (error) {
        // ignore cleanup failures
      }
    });
  }
};
