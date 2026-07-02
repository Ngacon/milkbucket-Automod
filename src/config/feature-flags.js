function readBooleanEnv(name, fallback) {
  const rawValue = process.env[name];

  if (rawValue == null) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(rawValue).toLowerCase());
}

module.exports = {
  AUTO_SYNC_SCHEMA: readBooleanEnv('AUTO_SYNC_SCHEMA', true),
  ENABLE_REDIS_CACHE: readBooleanEnv('ENABLE_REDIS_CACHE', true),
  LOG_COMMANDS: readBooleanEnv('LOG_COMMANDS', true)
};
