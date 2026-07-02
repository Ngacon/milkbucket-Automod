const util = require('node:util');

const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function normalizeError(error) {
  if (!(error instanceof Error)) {
    return error;
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
}

function normalizeValue(value) {
  if (value instanceof Error) {
    return normalizeError(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, innerValue]) => {
      accumulator[key] = normalizeValue(innerValue);
      return accumulator;
    }, {});
  }

  return value;
}

function createLogger(scope = 'app') {
  const minimumLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
  const minimumLevelValue = LEVELS[minimumLevel] || LEVELS.info;

  function write(level, message, meta = {}) {
    if ((LEVELS[level] || 0) < minimumLevelValue) {
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      scope,
      message
    };

    if (meta && Object.keys(meta).length > 0) {
      payload.meta = normalizeValue(meta);
    }

    const line = JSON.stringify(payload);

    if (level === 'error') {
      console.error(line);
      return;
    }

    if (level === 'warn') {
      console.warn(line);
      return;
    }

    console.log(line);
  }

  return {
    child(childScope) {
      return createLogger(`${scope}:${childScope}`);
    },
    debug(message, meta) {
      write('debug', message, meta);
    },
    info(message, meta) {
      write('info', message, meta);
    },
    warn(message, meta) {
      write('warn', message, meta);
    },
    error(message, meta) {
      write('error', message, meta);
    },
    inspect(value) {
      return util.inspect(value, { depth: 5, colors: false });
    }
  };
}

module.exports = {
  createLogger
};
