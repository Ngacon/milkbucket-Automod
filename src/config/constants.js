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

const EMBED_COLORS = {
  PRIMARY: 0xffffff,
  SUCCESS: 0x2ecc71,
  WARNING: 0xf39c12,
  ERROR: 0xe74c3c
};

const BOT_EMOJIS = {
  BROWTH: {
    mention: '<:browth:1489212216396742737>',
    imageUrl: 'https://cdn.discordapp.com/emojis/1489212216396742737.webp?size=96&quality=lossless'
  },
  AUTOMOD: {
    mention: '<:lmfaoo:1476882541641469992>',
    imageUrl: 'https://cdn.discordapp.com/emojis/1476882541641469992.webp?size=96&quality=lossless'
  },
  HIERARCHY: {
    mention: '<:vaidai:1489212317307768973>',
    imageUrl: 'https://cdn.discordapp.com/emojis/1489212317307768973.webp?size=96&quality=lossless'
  },
  USER_PERMISSIONS: {
    mention: '<:gahdayum:1476883760183119922>',
    imageUrl: 'https://cdn.discordapp.com/emojis/1476883760183119922.webp?size=96&quality=lossless'
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
  EMBED_COLORS,
  BOT_EMOJIS
};
