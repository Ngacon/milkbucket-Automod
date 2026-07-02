module.exports = {
  roles: {
    labels: {
      member: 'Member',
      role: 'Role',
      scope: 'Scope',
      message: 'Message',
      channel: 'Channel',
      emoji: 'Emoji',
      mappings: 'Mappings',
      status: 'Status',
      created: 'Created',
      updated: 'Updated',
      removed: 'Removed',
      revoked: 'Revoked',
      everyone: 'Entire server',
      humans: 'Humans',
      bots: 'Bots',
      processed: 'Processed',
      added: 'Added',
      skipped: 'Skipped',
      failed: 'Failed',
      duration: 'Processing time'
    },
    descriptions: {
      roleAdd: 'Give a role to a member.',
      roleRemove: 'Remove a role from a member.',
      roleAll: 'Give a role to everyone.',
      roleHumans: 'Give a role to humans.',
      roleBots: 'Give a role to bots.',
      autorole: 'Set autorole on join.',
      reactionRole: 'Create or update a reaction role.',
      reactionRoleList: 'Show reaction role mappings for a message.',
      reactionRoleRemove: 'Remove a reaction role mapping from a message.',
      reactionRoleSync: 'Sync roles for users who already reacted.'
    },
    responses: {
      roleAddTitle: 'Role Updated',
      roleRemoveTitle: 'Role Removed',
      roleBatchTitle: 'Bulk Role Distribution',
      roleAdded: 'Added {{role}} to {{user}}.',
      roleRemoved: 'Removed {{role}} from {{user}}.',
      roleApplied: 'Assigned role to {{count}} members.',
      roleBatchApplied: 'Assigned **{{role}}** to {{count}} matching members.',
      roleAlreadyAssigned: '{{user}} already has the {{role}} role.',
      roleNotAssigned: '{{user}} does not have the {{role}} role.',
      roleProtected: 'I cannot modify {{role}} because it is a managed or system role.',
      roleAboveBot:
        'I cannot modify {{role}} because it is higher than or equal to the bot highest role.',
      roleAboveUser:
        'You cannot modify {{role}} because it is higher than or equal to your highest role.',
      memberAboveUser: 'You cannot change roles for {{user}} because of the current hierarchy.',
      autoroleSet: 'Autorole set to {{role}}.',
      reactionRoleSetTitle: 'Reaction Role',
      reactionRoleListTitle: 'Reaction Role List',
      reactionRoleRemoveTitle: 'Reaction Role Removed',
      reactionRoleSyncTitle: 'Reaction Role Sync',
      reactionRoleCreated: 'Created a reaction role for {{emoji}} -> {{role}}.',
      reactionRoleUpdated: 'Updated the reaction role for {{emoji}} -> {{role}}.',
      reactionRoleRemoved: 'Removed the reaction role for {{emoji}}.',
      reactionRoleRemovedAndRevoked:
        'Removed the reaction role for {{emoji}} and revoked it from users who still had that reaction.',
      reactionRoleListSummary: 'This message currently has {{count}} reaction role mappings.',
      reactionRoleListEmpty: 'This message does not have any reaction role mappings yet.',
      reactionRoleRemoveMissing:
        'No reaction role mapping was found for emoji {{emoji}} on this message.',
      reactionRoleSyncDone: 'Completed sync for {{count}} reaction role mappings.',
      reactionRoleSyncMissingReaction: 'That reaction is not present on the target message.',
      reactionRoleInvalidMessage: 'Invalid message link or message ID.',
      reactionRoleWrongGuild: 'The target message must belong to the current server.',
      reactionRoleMessageNotFound: 'Unable to fetch the target message.',
      reactionRoleEmojiInvalid: 'Invalid emoji, or the bot cannot react with that emoji.',
      reactionRoleRoleMissing: 'The mapped role no longer exists.'
    }
  }
};
