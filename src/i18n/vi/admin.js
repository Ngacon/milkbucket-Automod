module.exports = {
  admin: {
    descriptions: {
      ban: 'Cấm thành viên vĩnh viễn.',
      unban: 'Gỡ cấm bằng ID.',
      softban: 'Ban rồi unban để xóa tin nhắn gần đây.',
      hackban: 'Ban người dùng bằng ID dù chưa vào server.',
      kick: 'Đá thành viên khỏi server.',
      mute: 'Khóa mõm tạm thời.',
      unmute: 'Mở khóa mõm.',
      timeout: 'Timeout thành viên.',
      untimeout: 'Gỡ timeout.',
      warn: 'Cảnh cáo thành viên.',
      warnings: 'Xem danh sách cảnh cáo.',
      clearwarns: 'Xóa toàn bộ cảnh cáo.',
      delwarn: 'Xóa 1 cảnh cáo.',
      clear: 'Xóa tin nhắn hàng loạt.',
      lock: 'Khóa kênh hiện tại.',
      lockdown: 'Khóa toàn server.',
      unlock: 'Mở khóa toàn server.',
      slowmode: 'Chỉnh chế độ chậm.',
      nuke: 'Clone kênh và xóa kênh cũ.'
    },
    responses: {
      actionSuccess: '{{action}} thành công.',
      actionFailure: '{{action}} thất bại.',
      warnAdded: 'Đã cảnh cáo {{user}}. ID cảnh cáo: {{id}}',
      warningsHeader: 'Danh sách cảnh cáo của {{user}}',
      warningsEmpty: 'Không có cảnh cáo nào.',
      warningsCleared: 'Đã xóa toàn bộ cảnh cáo của {{user}}.',
      warningDeleted: 'Đã xóa cảnh cáo ID {{id}}.',
      cleared: 'Đã xóa {{count}} tin nhắn.',
      channelLocked: 'Đã khóa kênh `{{channel}}`.',
      lockdownEnabled: 'Đã khóa toàn server.',
      lockdownDisabled: 'Đã mở khóa toàn server.',
      softbanDone: 'Đã softban {{user}}.',
      hackbanDone: 'Đã hackban {{user}}.',
      slowmodeSet: 'Đã đặt slowmode: {{seconds}}s.',
      nukeDone: 'Kênh mới đã được tạo.'
    }
  }
};
