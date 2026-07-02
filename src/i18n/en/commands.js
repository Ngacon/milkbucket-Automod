module.exports = {
  commands: {
    ping: {
      description: 'Check bot latency.',
      successTitle: 'Pong!',
      successDescription: 'The bot is responding normally.'
    },
    prefix: {
      description: 'Show or change the server prefix.',
      currentTitle: 'Current Prefix',
      currentDescription: 'The current prefix is `{{prefix}}`.',
      updatedTitle: 'Prefix Updated',
      updatedDescription: 'The new server prefix is `{{prefix}}`.',
      resetTitle: 'Prefix Reset',
      resetDescription: 'The prefix has been reset to the defaults: `{{prefix}}`.'
    },
    language: {
      description: 'Show or change the server language.',
      currentTitle: 'Current Language',
      currentDescription: 'The current language is `{{locale}}`.',
      updatedTitle: 'Language Updated',
      updatedDescription: 'The new server language is `{{locale}}`.'
    }
  }
};
