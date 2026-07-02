const {
  DEFAULT_LOCALE,
  MAX_PREFIX_LENGTH,
  MIN_PREFIX_LENGTH,
  SUPPORTED_LOCALES
} = require('../config/constants');

function isIgnorableMessage(message) {
  return !message || !message.content || message.author?.bot;
}

function parseCommandInput(content, prefix) {
  const body = content.slice(prefix.length).trim();

  if (!body) {
    return null;
  }

  const tokens = body.split(/\s+/).filter(Boolean);
  const commandName = tokens[0]?.toLowerCase();

  if (!commandName) {
    return null;
  }

  return {
    body,
    tokens,
    commandName,
    args: tokens.slice(1)
  };
}

function validateCommandArgs(command, args, prefix) {
  const argSpec = command.meta?.args || command.args || {};
  const minimum = argSpec.min ?? 0;
  const maximum = argSpec.max ?? Number.POSITIVE_INFINITY;
  const usageLabel = String(argSpec.usage || command.meta?.name || command.name || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (args.length < minimum || args.length > maximum) {
    return {
      key: 'common.errors.invalidCommandUsage',
      params: {
        usage: `${prefix}${usageLabel}`
      }
    };
  }

  return null;
}

function validatePrefix(prefix) {
  if (typeof prefix !== 'string') {
    return {
      valid: false,
      key: 'common.errors.invalidPrefix',
      params: {
        min: MIN_PREFIX_LENGTH,
        max: MAX_PREFIX_LENGTH
      }
    };
  }

  const normalizedPrefix = prefix.trim();
  const containsWhitespace = /\s/.test(normalizedPrefix);

  if (
    normalizedPrefix.length < MIN_PREFIX_LENGTH ||
    normalizedPrefix.length > MAX_PREFIX_LENGTH ||
    containsWhitespace
  ) {
    return {
      valid: false,
      key: 'common.errors.invalidPrefix',
      params: {
        min: MIN_PREFIX_LENGTH,
        max: MAX_PREFIX_LENGTH
      }
    };
  }

  return {
    valid: true,
    value: normalizedPrefix
  };
}

function normalizeLocale(locale) {
  const normalizedLocale = String(locale || '').trim().toLowerCase();
  return SUPPORTED_LOCALES.includes(normalizedLocale) ? normalizedLocale : null;
}

function resolveLocale(locale) {
  return normalizeLocale(locale) || DEFAULT_LOCALE;
}

module.exports = {
  isIgnorableMessage,
  parseCommandInput,
  validateCommandArgs,
  validatePrefix,
  normalizeLocale,
  resolveLocale
};
