module.exports = {
  system: {
    descriptions: {
      help: 'Mở trang chủ trợ giúp và tra cứu chi tiết lệnh.',
      ping: 'Kiểm tra độ trễ bot.'
    },
    responses: {
      helpTitle: 'Trung tâm trợ giúp',
      helpCategory: 'Mục: {{category}}',
      helpHomeSummary: 'Hiện có {{total}} lệnh trong {{categories}} mục.',
      helpCategorySummary: 'Mục {{category}} hiện có {{count}} lệnh trong tổng số {{total}} lệnh.',
      helpLocked: 'Chỉ người gọi lệnh mới dùng được menu này.',
      helpOpenOverview: 'Mở trang chủ help',
      helpOpenCommand: 'Xem chi tiết một lệnh',
      helpOpenNestedCommand: 'Xem chi tiết lệnh nhiều từ',
      helpRunExample: 'Mở nhanh phần trạng thái',
      helpSidebarHint: 'Dùng menu bên dưới để chuyển mục.',
      noDescription: 'Chưa có mô tả.'
    },
    labels: {
      usage: 'Cách dùng',
      aliases: 'Alias',
      selectCategory: 'Chọn mục',
      permissions: 'Quyền cần có',
      cooldown: 'Hồi chiêu',
      category: 'Mục',
      examples: 'Ví dụ',
      relatedCommands: 'Lệnh liên quan',
      quickStart: 'Bắt đầu nhanh',
      categories: 'Các mục hiện có',
      none: 'Không có'
    },
    categories: {
      home: 'Trang chủ',
      admin: 'Quản trị',
      moderation: 'Điều phối',
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
