module.exports = {
  moderation: {
    descriptions: {
      setlog: 'Đặt kênh modlog cho warn và các án phạt.'
    },
    responses: {
      modlogSet: 'Đã đặt modlog tại {{channel}}.',
      logTitle: 'Modlog • {{action}}',
      noReason: 'Không có'
    },
    labels: {
      user: 'Người dùng',
      moderator: 'Moderator',
      action: 'Hành động',
      reason: 'Lý do',
      duration: 'Thời gian',
      warningId: 'Mã cảnh cáo',
      warnCount: 'Số warn'
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
