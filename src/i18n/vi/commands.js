module.exports = {
  commands: {
    ping: {
      description: 'Kiểm tra độ trễ của bot.',
      successTitle: 'Pong!',
      successDescription: 'Bot đang hoạt động ổn định.'
    },
    prefix: {
      description: 'Xem hoặc đổi prefix của server.',
      currentTitle: 'Prefix hiện tại',
      currentDescription: 'Prefix hiện tại là `{{prefix}}`.',
      updatedTitle: 'Cập nhật prefix',
      updatedDescription: 'Prefix mới của server là `{{prefix}}`.',
      resetTitle: 'Đã reset prefix',
      resetDescription: 'Prefix đã được trả về mặc định: `{{prefix}}`.'
    },
    language: {
      description: 'Xem hoặc đổi ngôn ngữ của server.',
      currentTitle: 'Ngôn ngữ hiện tại',
      currentDescription: 'Ngôn ngữ hiện tại là `{{locale}}`.',
      updatedTitle: 'Cập nhật ngôn ngữ',
      updatedDescription: 'Ngôn ngữ mới của server là `{{locale}}`.'
    }
  }
};
