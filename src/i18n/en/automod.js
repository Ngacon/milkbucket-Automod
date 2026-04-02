module.exports = {
  automod: {
    descriptions: {
      automod: 'Enable or disable AutoMod.',
      antilink: 'Toggle anti-link.',
      antiinvite: 'Toggle anti-invite.',
      antispam: 'Toggle anti-spam.',
      antidup: 'Toggle anti-duplicate.',
      anticaps: 'Toggle anti-caps.',
      antimention: 'Set mention limit.',
      addword: 'Add a banned word.',
      delword: 'Remove a banned word.',
      listwords: 'List banned words.'
    },
    responses: {
      toggled: '{{feature}} is now {{state}}.',
      wordAdded: 'Added banned word: {{word}}',
      wordRemoved: 'Removed banned word: {{word}}',
      wordsList: 'Banned words: {{words}}',
      wordsEmpty: 'Banned word list is empty.'
    },
    features: {
      automod: 'Automod',
      antilink: 'Anti-link',
      antiinvite: 'Anti-invite',
      antispam: 'Anti-spam',
      antidup: 'Anti-duplicate',
      anticaps: 'Anti-caps',
      antimention: 'Anti-mention'
    },
    violations: {
      antilink: 'Links are not allowed.',
      antiinvite: 'Invites are not allowed.',
      antispam: 'Stop spamming, bro.',
      antidup: 'Duplicate messages are not allowed.',
      anticaps: 'Too many capital letters.',
      antimention: 'Too many mentions (max {{max}}).',
      badword: 'That word is not allowed.'
    }
  }
};
