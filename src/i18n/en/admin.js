module.exports = {
  admin: {
    descriptions: {
      ban: 'Ban a member permanently.',
      unban: 'Unban by ID.',
      softban: 'Ban and unban a member to remove recent messages.',
      hackban: 'Ban a user by ID even if they never joined.',
      kick: 'Kick a member from the server.',
      mute: 'Temporarily mute a member.',
      unmute: 'Remove mute.',
      timeout: 'Timeout a member.',
      untimeout: 'Remove timeout.',
      warn: 'Warn a member.',
      warnings: 'List warnings.',
      clearwarns: 'Clear all warnings.',
      delwarn: 'Delete one warning.',
      clear: 'Bulk delete messages.',
      lock: 'Lock the current channel.',
      lockdown: 'Lock the whole server.',
      unlock: 'Unlock the whole server.',
      slowmode: 'Set slowmode.',
      nuke: 'Clone channel and delete the old one.'
    },
    responses: {
      actionSuccess: '{{action}} succeeded.',
      actionFailure: '{{action}} failed.',
      warnAdded: 'Warned {{user}}. Warning ID: {{id}}',
      warningsHeader: 'Warnings for {{user}}',
      warningsEmpty: 'No warnings found.',
      warningsCleared: 'Cleared all warnings for {{user}}.',
      warningDeleted: 'Deleted warning ID {{id}}.',
      cleared: 'Deleted {{count}} messages.',
      channelLocked: 'Locked channel `{{channel}}`.',
      lockdownEnabled: 'Server locked.',
      lockdownDisabled: 'Server unlocked.',
      softbanDone: 'Softbanned {{user}}.',
      hackbanDone: 'Hackbanned {{user}}.',
      slowmodeSet: 'Slowmode set to {{seconds}}s.',
      nukeDone: 'New channel created.'
    }
  }
};
