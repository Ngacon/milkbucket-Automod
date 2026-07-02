module.exports = {
  channels: {
    descriptions: {
      createText: 'Tạo kênh văn bản.',
      createVoice: 'Tạo kênh thoại.',
      createCat: 'Tạo danh mục mới.',
      deleteChannel: 'Xóa kênh hiện tại.',
      cloneChannel: 'Nhân bản kênh hiện tại.',
      moveChannel: 'Di chuyển kênh bằng số, top/bottom hoặc above/below.',
      syncPerm: 'Đồng bộ quyền với danh mục.',
      setNsfw: 'Bật hoặc tắt NSFW cho kênh hiện tại.',
      hideChannel: 'Ẩn kênh khỏi member thường.',
      showChannel: 'Hiện lại kênh.'
    },
    labels: {
      moveModes: 'Cách dùng nhanh',
      moveCurrent: 'Vị trí cũ',
      moveTarget: 'Vị trí mới'
    },
    responses: {
      channelCreated: 'Đã tạo {{name}}.',
      channelDeleted: 'Đã xóa kênh.',
      channelCloned: 'Đã nhân bản kênh.',
      channelMoved: 'Đã di chuyển kênh',
      channelMovedDetails:
        'Kênh `{{channel}}` đã được chuyển từ vị trí `#{{from}}` sang `#{{to}}` theo kiểu `{{target}}`.',
      moveHelpTitle: 'Cách dùng move channel',
      moveHelpDescription:
        'Bạn có thể di chuyển kênh bằng số thứ tự trực quan hoặc các từ khóa dễ nhớ.',
      moveModes: [
        '`move channel 1` - Đưa kênh lên vị trí số 1',
        '`move channel top` - Đưa kênh lên đầu',
        '`move channel bottom` - Đưa kênh xuống cuối',
        '`move channel +1` - Dời xuống 1 bậc',
        '`move channel -1` - Kéo lên 1 bậc',
        '`move channel above #rules` - Đưa lên trên một kênh khác',
        '`move channel below #chat` - Đưa xuống dưới một kênh khác'
      ].join('\n'),
      channelSynced: 'Đã đồng bộ quyền.',
      nsfwEnabled: 'Đã bật NSFW cho `{{channel}}`.',
      nsfwDisabled: 'Đã tắt NSFW cho `{{channel}}`.',
      channelHidden: 'Đã ẩn kênh.',
      channelShown: 'Đã hiện kênh.'
    }
  }
};
