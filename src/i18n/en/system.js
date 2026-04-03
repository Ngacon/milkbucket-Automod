module.exports = {
  system: {
    descriptions: {
      help: 'Open the help home page and inspect command details.',
      ping: 'Check bot latency.'
    },
    responses: {
      helpTitle: 'Help Center',
      helpCategory: 'Section: {{category}}',
      helpHomeSummary: 'There are {{total}} commands across {{categories}} sections.',
      helpCategorySummary: '{{category}} currently contains {{count}} commands out of {{total}} total.',
      helpLocked: 'Only the command author can use this menu.',
      helpOpenOverview: 'Open the help home page',
      helpOpenCommand: 'Open one command guide',
      helpOpenNestedCommand: 'Open a multi-word command guide',
      helpRunExample: 'Quickly open status',
      helpSidebarHint: 'Use the menu below to switch sections.',
      noDescription: 'No description yet.'
    },
    labels: {
      usage: 'Usage',
      aliases: 'Aliases',
      selectCategory: 'Select a section',
      permissions: 'Required permissions',
      cooldown: 'Cooldown',
      category: 'Section',
      examples: 'Examples',
      relatedCommands: 'Related commands',
      quickStart: 'Quick start',
      categories: 'Available sections',
      none: 'None'
    },
    categories: {
      home: 'Home',
      admin: 'Admin',
      moderation: 'Moderation',
      automod: 'AutoMod',
      roles: 'Roles',
      channels: 'Channels',
      info: 'Info',
      utility: 'Utility',
      fun: 'Fun',
      system: 'System'
    }
  }
};
