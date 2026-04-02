const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const {
  getUniqueCommands,
  groupCommandsByCategory,
  resolveCommand,
  normalizeCommandKey,
  formatCommandLabel
} = require('../../app/command-registry');

const CATEGORY_EMOJIS = {
  admin: '🛡️',
  automod: '🤖',
  roles: '🎭',
  channels: '🧱',
  info: '📌',
  utility: '🧰',
  fun: '✨',
  system: '⚙️'
};

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

function buildCategoryMenu(categories, activeCategory, t) {
  return new StringSelectMenuBuilder()
    .setCustomId('help:category')
    .setPlaceholder(t('system.labels.selectCategory'))
    .addOptions(
      categories.map((category) => ({
        label: t(`system.categories.${category}`),
        value: category,
        emoji: CATEGORY_EMOJIS[category],
        default: category === activeCategory
      }))
    );
}

function buildOverviewEmbed({
  buildEmbed,
  colors,
  t,
  prefix,
  totalCommands,
  categories,
  selectedCategory,
  commands,
  botUser
}) {
  const categoryLabel = t(`system.categories.${selectedCategory}`);
  const commandLines = commands.map((command) => {
    const description = t(command.meta.descriptionKey || 'system.responses.noDescription');
    return `• \`${prefix}${formatCommandLabel(command.meta.name)}\`\n${description}`;
  });

  const fields = [
    {
      name: t('system.labels.quickStart'),
      value: [
        `\`${prefix}help\` - ${t('system.responses.helpOpenOverview')}`,
        `\`${prefix}help ban\` - ${t('system.responses.helpOpenCommand')}`,
        `\`${prefix}help role add\` - ${t('system.responses.helpOpenNestedCommand')}`,
        `\`${prefix}move channel top\` - ${t('system.responses.helpRunExample')}`
      ].join('\n'),
      inline: false
    },
    {
      name: t('system.labels.categories'),
      value: categories
        .map((category) => `${CATEGORY_EMOJIS[category] || '•'} ${t(`system.categories.${category}`)}`)
        .join(' | '),
      inline: false
    }
  ];

  const chunks = chunkLines(commandLines);
  for (let index = 0; index < chunks.length; index += 1) {
    fields.push({
      name:
        index === 0
          ? `${CATEGORY_EMOJIS[selectedCategory] || '•'} ${categoryLabel}`
          : `${categoryLabel} ${index + 1}`,
      value: chunks[index],
      inline: false
    });
  }

  return buildEmbed({
    color: colors.PRIMARY,
    title: t('system.responses.helpTitle'),
    description: t('system.responses.helpSummary', {
      total: totalCommands,
      category: categoryLabel,
      count: commands.length
    }),
    author: botUser
      ? {
          name: t('system.responses.helpCategory', {
            category: categoryLabel
          }),
          iconURL: botUser.displayAvatarURL({ size: 128 })
        }
      : undefined,
    thumbnail: botUser?.displayAvatarURL({ size: 256 }),
    fields
  });
}

function buildDetailEmbed({
  buildEmbed,
  colors,
  t,
  prefix,
  command,
  relatedCommands,
  botUser
}) {
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

  if (meta.aliases?.length) {
    examples.push(`\`${prefix}${formatCommandLabel(meta.aliases[0])}\``);
  }

  return buildEmbed({
    color: colors.PRIMARY,
    title: `${CATEGORY_EMOJIS[meta.category] || '•'} ${prefix}${commandLabel}`,
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
    const categories = Object.keys(groupedCommands).sort();
    const defaultCategory = categories[0] || 'system';
    const botUser = message.client.user || null;
    let activeCategory = defaultCategory;

    const getCategoryCommands = (categoryKey) =>
      (groupedCommands[categoryKey] || []).sort((left, right) =>
        formatCommandLabel(left.meta.name).localeCompare(formatCommandLabel(right.meta.name))
      );

    const buildRows = (categoryKey) => [
      new ActionRowBuilder().addComponents(buildCategoryMenu(categories, categoryKey, t))
    ];

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

    activeCategory = queriedCommand?.meta.category || defaultCategory;

    const sent = await reply({
      embeds: [
        queriedCommand
          ? buildDetailEmbed({
              buildEmbed,
              colors,
              t,
              prefix,
              command: queriedCommand,
              relatedCommands: getCategoryCommands(activeCategory)
                .filter((command) => command.meta.name !== queriedCommand.meta.name)
                .slice(0, 6),
              botUser
            })
          : buildOverviewEmbed({
              buildEmbed,
              colors,
              t,
              prefix,
              totalCommands: uniqueCommands.length,
              categories,
              selectedCategory: activeCategory,
              commands: getCategoryCommands(activeCategory),
              botUser
            })
      ],
      components: buildRows(activeCategory)
    });

    if (!sent) {
      return;
    }

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

      activeCategory = interaction.values[0];
      await interaction.update({
        embeds: [
          buildOverviewEmbed({
            buildEmbed,
            colors,
            t,
            prefix,
            totalCommands: uniqueCommands.length,
            categories,
            selectedCategory: activeCategory,
            commands: getCategoryCommands(activeCategory),
            botUser
          })
        ],
        components: buildRows(activeCategory)
      });
    });

    collector.on('end', async () => {
      try {
        const rows = buildRows(activeCategory);
        rows[0].components[0].setDisabled(true);
        await sent.edit({ components: rows });
      } catch (error) {
        // ignore cleanup failures
      }
    });
  }
};
