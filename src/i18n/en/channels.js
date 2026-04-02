module.exports = {
  channels: {
    descriptions: {
      createText: 'Create a text channel.',
      createVoice: 'Create a voice channel.',
      createCat: 'Create a category.',
      deleteChannel: 'Delete the current channel.',
      cloneChannel: 'Clone the channel.',
      moveChannel: 'Move a channel with numbers, top/bottom, or above/below.',
      syncPerm: 'Sync permissions.',
      setNsfw: 'Toggle NSFW for the current channel.',
      hideChannel: 'Hide the channel.',
      showChannel: 'Show the channel.'
    },
    labels: {
      moveModes: 'Quick guide',
      moveCurrent: 'From',
      moveTarget: 'To'
    },
    responses: {
      channelCreated: 'Created channel {{name}}.',
      channelDeleted: 'Channel deleted.',
      channelCloned: 'Channel cloned.',
      channelMoved: 'Channel moved',
      channelMovedDetails: 'Moved `{{channel}}` from `#{{from}}` to `#{{to}}` using `{{target}}`.',
      moveHelpTitle: 'How to use move channel',
      moveHelpDescription: 'You can move a channel with a visual number or a simple keyword.',
      moveModes: [
        '`move channel 1` - Move the channel to slot 1',
        '`move channel top` - Move the channel to the top',
        '`move channel bottom` - Move the channel to the bottom',
        '`move channel +1` - Move it down by 1 slot',
        '`move channel -1` - Move it up by 1 slot',
        '`move channel above #rules` - Place it above another channel',
        '`move channel below #chat` - Place it below another channel'
      ].join('\n'),
      channelSynced: 'Permissions synced.',
      nsfwEnabled: 'Enabled NSFW for `{{channel}}`.',
      nsfwDisabled: 'Disabled NSFW for `{{channel}}`.',
      channelHidden: 'Channel hidden.',
      channelShown: 'Channel visible.'
    }
  }
};
