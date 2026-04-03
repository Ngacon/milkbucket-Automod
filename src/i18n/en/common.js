module.exports = {
  common: {
    status: {
      ready: 'milkbucket is ready.'
    },
    labels: {
      latency: 'Latency',
      websocket: 'WebSocket',
      prefix: 'Prefix',
      language: 'Language',
      id: 'ID',
      joined: 'Joined',
      created: 'Created',
      members: 'Members',
      color: 'Color',
      position: 'Position',
      mention: 'Mention',
      channel: 'Channel',
      on: 'on',
      off: 'off'
    },
    responses: {
      success: 'Success.',
      failure: 'Failed.',
      requestedBy: 'Requested by {{user}} • {{time}}'
    },
    errors: {
      generic: 'An error occurred while processing the command.',
      guildOnly: 'This command can only be used inside a server.',
      missingUserPermissions: 'You are missing permissions: {{permissions}}',
      ownerWhitelistOnly: 'Only whitelisted owners can change AutoMod settings.',
      missingBotPermissions: 'I am missing permissions: {{permissions}}',
      targetAboveBot:
        'I cannot manage {{user}} because they are higher than the bot in the role hierarchy.',
      invalidCommandUsage: 'Invalid usage. Use: `{{usage}}`',
      invalidPrefix:
        'Invalid prefix. Prefix must be between {{min}} and {{max}} characters and contain no whitespace.',
      invalidLocale: 'Invalid language. Supported locales: {{locales}}',
      commandNotFound: 'Unknown command `{{command}}`.',
      cooldown: 'Please wait {{seconds}}s before using this command again.'
    }
  }
};
