module.exports = {
  moderation: {
    descriptions: {
      setlog: 'Set the modlog channel for warns and punishments.'
    },
    responses: {
      modlogSet: 'Modlog channel set to {{channel}}.',
      logTitle: 'Modlog • {{action}}',
      noReason: 'None'
    },
    labels: {
      user: 'User',
      moderator: 'Moderator',
      action: 'Action',
      reason: 'Reason',
      duration: 'Duration',
      warningId: 'Warning ID',
      warnCount: 'Warn count'
    },
    actions: {
      warn: 'Warn',
      ban: 'Ban',
      kick: 'Kick',
      mute: 'Mute',
      timeout: 'Timeout'
    }
  }
};
