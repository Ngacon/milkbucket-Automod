module.exports = {
  system: {
    descriptions: {
      help: 'Tra cứu danh sách lệnh và xem chi tiết từng lệnh.',
      ping: 'Kiểm tra độ trễ bot.'
    },
    responses: {
      helpTitle: 'Bảng Tra Cứu Lệnh',
      helpCategory: 'Danh mục: {{category}}',
      helpSummary: 'Hiện có {{total}} lệnh. Nhóm {{category}} đang có {{count}} lệnh.',
      helpLocked: 'Chỉ người gọi lệnh mới dùng được menu này.',
      helpOpenOverview: 'Mở bảng tổng quan',
      helpOpenCommand: 'Mở chi tiết một lệnh',
      helpOpenNestedCommand: 'Mở chi tiết lệnh nhiều từ',
      helpRunExample: 'Ví dụ dùng thật',
      noDescription: 'Chưa có mô tả.'
    },
    labels: {
      usage: 'Cách dùng',
      aliases: 'Alias',
      selectCategory: 'Chọn danh mục',
      permissions: 'Quyền cần có',
      cooldown: 'Hồi chiêu',
      category: 'Danh mục',
      examples: 'Ví dụ',
      relatedCommands: 'Lệnh liên quan',
      quickStart: 'Bắt đầu nhanh',
      categories: 'Danh mục hiện có',
      none: 'Không có'
    },
    categories: {
      admin: 'Quản trị',
      automod: 'AutoMod',
      roles: 'Vai trò',
      channels: 'Kênh',
      info: 'Thông tin',
      utility: 'Tiện ích',
      fun: 'Giải trí',
      system: 'Hệ thống'
    }
  }
};
