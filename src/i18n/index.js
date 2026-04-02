const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_LOCALE, FALLBACK_LOCALE } = require('../config/constants');

const translations = {};

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(target, source) {
  const output = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(output[key])) {
      output[key] = deepMerge(output[key], value);
      continue;
    }

    output[key] = value;
  }

  return output;
}

function getByPath(target, dottedPath) {
  return dottedPath.split('.').reduce((current, segment) => {
    if (current == null) {
      return undefined;
    }

    return current[segment];
  }, target);
}

function interpolate(template, params) {
  return String(template).replace(/\{\{(.*?)\}\}/g, (_, token) => {
    const key = token.trim();
    return params[key] == null ? `{{${key}}}` : String(params[key]);
  });
}

function loadLocaleFiles(localeDirectory) {
  const files = fs
    .readdirSync(localeDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .sort((left, right) => left.name.localeCompare(right.name));

  return files.reduce((accumulator, file) => {
    const filePath = path.join(localeDirectory, file.name);
    delete require.cache[require.resolve(filePath)];
    const fileExports = require(filePath);
    return deepMerge(accumulator, fileExports);
  }, {});
}

function loadTranslations(baseDirectory = __dirname) {
  const localeDirectories = fs
    .readdirSync(baseDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  for (const localeDirectory of localeDirectories) {
    translations[localeDirectory.name] = loadLocaleFiles(
      path.join(baseDirectory, localeDirectory.name)
    );
  }

  return translations;
}

function getAvailableLocales() {
  return Object.keys(translations);
}

function t(locale, key, params = {}) {
  const resolvedLocale = translations[locale] ? locale : DEFAULT_LOCALE;
  const primaryValue = getByPath(translations[resolvedLocale], key);
  const fallbackValue = getByPath(translations[FALLBACK_LOCALE], key);
  const result = primaryValue ?? fallbackValue ?? key;

  if (typeof result !== 'string') {
    return result ?? key;
  }

  return interpolate(result, params);
}

function reloadTranslations() {
  for (const locale of Object.keys(translations)) {
    delete translations[locale];
  }

  return loadTranslations(__dirname);
}

loadTranslations(__dirname);

module.exports = {
  loadTranslations,
  reloadTranslations,
  getAvailableLocales,
  t
};
