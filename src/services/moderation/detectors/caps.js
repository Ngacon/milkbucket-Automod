function getLetters(content) {
  return String(content || '').match(/\p{L}/gu) || [];
}

function countUppercaseWords(content) {
  return String(content || '')
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
    .filter((token) => {
      const letters = token.match(/\p{L}/gu) || [];
      if (letters.length < 3) {
        return false;
      }

      const uppercaseLetters = token.match(/\p{Lu}/gu) || [];
      return uppercaseLetters.length === letters.length;
    }).length;
}

function analyzeCaps(content) {
  const letters = getLetters(content);
  const uppercaseLetters = String(content || '').match(/\p{Lu}/gu) || [];
  const uppercaseWords = countUppercaseWords(content);

  if (letters.length < 6) {
    return {
      triggered: false,
      ratio: 0,
      letters: letters.length,
      uppercaseLetters: uppercaseLetters.length,
      uppercaseWords
    };
  }

  const ratio = uppercaseLetters.length / letters.length;
  const triggered =
    ratio >= 0.7 ||
    uppercaseWords >= 3 ||
    (uppercaseLetters.length >= 10 && ratio >= 0.6);

  return {
    triggered,
    ratio,
    letters: letters.length,
    uppercaseLetters: uppercaseLetters.length,
    uppercaseWords
  };
}

module.exports = {
  name: 'caps',
  type: 'automod',
  async check(ctx) {
    if (ctx.kind !== 'message' || !ctx.config.enabled || !ctx.config.rules.caps) {
      return null;
    }

    if (!ctx.message || ctx.message.author?.bot || ctx.message.webhookId) {
      return null;
    }

    const analysis = analyzeCaps(ctx.message.content);
    if (!analysis.triggered) {
      return null;
    }

    return {
      triggered: true,
      severity: analysis.ratio >= 0.9 || analysis.uppercaseWords >= 4 ? 2 : 1,
      reason: 'Viết hoa quá nhiều',
      flags: {
        autowarn: true,
        delete: true,
        escalate: true
      },
      meta: {
        ratio: analysis.ratio,
        letters: analysis.letters,
        uppercaseLetters: analysis.uppercaseLetters,
        uppercaseWords: analysis.uppercaseWords
      }
    };
  }
};
