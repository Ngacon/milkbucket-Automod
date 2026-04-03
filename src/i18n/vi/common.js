module.exports = {
  common: {
    status: {
      ready: 'milkbucket đã sẵn sàng.'
    },
    labels: {
      latency: 'Độ trễ',
      websocket: 'WebSocket',
      prefix: 'Tiền tố',
      language: 'Ngôn ngữ',
      id: 'ID',
      joined: 'Tham gia',
      created: 'Tạo lúc',
      members: 'Thành viên',
      color: 'Màu',
      position: 'Vị trí',
      mention: 'Mention',
      channel: 'Kênh',
      on: 'bật',
      off: 'tắt'
    },
    responses: {
      success: 'Thành công.',
      failure: 'Thất bại.',
      requestedBy: 'Được yêu cầu bởi {{user}} • {{time}}'
    },
    errors: {
      generic: 'Có lỗi xảy ra.',
      guildOnly: 'Chỉ dùng được trong server.',
      missingUserPermissions: 'Bạn thiếu quyền: {{permissions}}',
      ownerWhitelistOnly: 'Chỉ owner server hoặc owner nằm trong whitelist mới được sửa AutoMod.',
      missingBotPermissions: 'Bot đang thiếu quyền: {{permissions}}',
      targetAboveBot: 'Bot không thể xử lý {{user}} vì target đang cao quyền hơn bot.',
      invalidCommandUsage: 'Sai cú pháp. Dùng: `{{usage}}`',
      invalidPrefix: 'Prefix không hợp lệ ({{min}}-{{max}} ký tự, không có khoảng trắng).',
      invalidLocale: 'Ngôn ngữ không hợp lệ: {{locales}}',
      commandNotFound: 'Không tìm thấy lệnh `{{command}}`.',
      cooldown: 'Chờ {{seconds}}s rồi thử lại.'
    }
  }
};
