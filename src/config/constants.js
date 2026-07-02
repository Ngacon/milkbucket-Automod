const APP_NAME = 'milkbucket';
const DEFAULT_LOCALE = 'vi';
const FALLBACK_LOCALE = 'vi';
const SUPPORTED_LOCALES = ['vi', 'en'];
const DEFAULT_PREFIXES = ['m!', 'm?'];
const MAX_PREFIX_LENGTH = 10;
const MIN_PREFIX_LENGTH = 1;
const SETTINGS_CACHE_TTL_SECONDS = 60 * 60;
const BOT_OWNER_IDS = String(process.env.BOT_OWNER_IDS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const AUTOMOD_PROTECTED_CHANNEL_ID = '1382898536898887791';
const AUTOMOD_SPAM_ALLOWED_CHANNEL_ID = '1512985271799382047';
const AUTOMOD_LOG_CHANNEL_ID = '1513548623168671794';
const JAIL_ROLE_ID = '1414255151920844852';

const EMBED_COLORS = {
  PRIMARY: 0xeff6ff,
  ACCENT: 0x3b82f6,
  INFO: 0x38bdf8,
  SUCCESS: 0x2ecc71,
  WARNING: 0xf39c12,
  ERROR: 0xe74c3c,
  MUTED: 0x6366f1
};

const ROLE_BATCH = {
  // Increased concurrency to process role batches faster. Adjust based on server capacity.
  CONCURRENCY: 16,
  CHUNK_SIZE: 20
};

const BOT_EMOJIS = {
  BROWTH: {
    mention: '',
    imageUrl: ''
  },
  AUTOMOD: {
    mention: '',
    imageUrl: ''
  },
  HIERARCHY: {
    mention: '',
    imageUrl: ''
  },
  USER_PERMISSIONS: {
    mention: '',
    imageUrl: ''
  }
};

module.exports = {
  APP_NAME,
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  SUPPORTED_LOCALES,
  DEFAULT_PREFIXES,
  MAX_PREFIX_LENGTH,
  MIN_PREFIX_LENGTH,
  SETTINGS_CACHE_TTL_SECONDS,
  BOT_OWNER_IDS,
  AUTOMOD_PROTECTED_CHANNEL_ID,
  AUTOMOD_SPAM_ALLOWED_CHANNEL_ID,
  AUTOMOD_LOG_CHANNEL_ID,
  EMBED_COLORS,
  BOT_EMOJIS,
  ROLE_BATCH,
  JAIL_ROLE_ID
};
