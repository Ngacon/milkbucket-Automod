module.exports = {
  automod: {
    descriptions: {
      automod: 'Bật hoặc tắt toàn bộ AutoMod.',
      antilink: 'Bật hoặc tắt chống link.',
      antiinvite: 'Bật hoặc tắt chống invite.',
      antispam: 'Bật hoặc tắt chống spam.',
      antidup: 'Bật hoặc tắt chống trùng lặp.',
      anticaps: 'Bật hoặc tắt chống viết hoa quá nhiều.',
      antimention: 'Giới hạn số lượng tag.',
      addword: 'Thêm từ cấm.',
      delword: 'Xóa từ cấm.',
      listwords: 'Xem danh sách từ cấm.'
    },
    responses: {
      toggled: 'Đã {{state}} {{feature}}.',
      wordAdded: 'Đã thêm từ cấm: {{word}}',
      wordRemoved: 'Đã xóa từ cấm: {{word}}',
      wordsList: 'Danh sách từ cấm: {{words}}',
      wordsEmpty: 'Danh sách từ cấm đang trống.'
    },
    features: {
      automod: 'AutoMod',
      antilink: 'AntiLink',
      antiinvite: 'AntiInvite',
      antispam: 'AntiSpam',
      antidup: 'AntiDup',
      anticaps: 'AntiCaps',
      antimention: 'AntiMention'
    },
    violations: {
      antilink: 'Không được gửi link.',
      antiinvite: 'Không được gửi link mời.',
      antispam: 'Đừng spam nữa bro.',
      antidup: 'Không được gửi tin nhắn trùng lặp.',
      anticaps: 'Không được viết hoa quá nhiều.',
      antimention: 'Không được tag quá {{max}} người.',
      badword: 'Không được dùng từ cấm.'
    }
  }
};
