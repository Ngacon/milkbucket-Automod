module.exports = {
  system: {
    descriptions: {
      help: 'Browse command categories and detailed command guides.',
      ping: 'Check bot latency.'
    },
    responses: {
      helpTitle: 'Command Reference',
      helpCategory: 'Category: {{category}}',
      helpSummary: 'There are {{total}} commands available. {{category}} currently has {{count}} commands.',
      helpLocked: 'Only the command author can use this menu.',
      helpOpenOverview: 'Open the command overview',
      helpOpenCommand: 'Open a specific command guide',
      helpOpenNestedCommand: 'Open a multi-word command guide',
      helpRunExample: 'See a real example call',
      noDescription: 'No description yet.'
    },
    labels: {
      usage: 'Usage',
      aliases: 'Aliases',
      selectCategory: 'Select a category',
      permissions: 'Required permissions',
      cooldown: 'Cooldown',
      category: 'Category',
      examples: 'Examples',
      relatedCommands: 'Related commands',
      quickStart: 'Quick start',
      categories: 'Available categories',
      none: 'None'
    },
    categories: {
      admin: 'Admin',
      automod: 'Automod',
      roles: 'Roles',
      channels: 'Channels',
      info: 'Info',
      utility: 'Utility',
      fun: 'Fun',
      system: 'System'
    }
  }
};
