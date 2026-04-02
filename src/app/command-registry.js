function normalizeCommandKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCommandKeys(command) {
  const meta = command?.meta || {};
  const keys = [meta.name, ...(meta.aliases || [])]
    .map(normalizeCommandKey)
    .filter(Boolean);

  return [...new Set(keys)];
}

function buildRegistry(commands, logger) {
  const registry = new Map();
  let maxDepth = 1;

  for (const command of commands) {
    const keys = getCommandKeys(command);

    for (const key of keys) {
      maxDepth = Math.max(maxDepth, key.split(' ').length);

      if (registry.has(key)) {
        logger.warn('Duplicate command alias ignored', {
          alias: key,
          command: command.meta?.name || null
        });
        continue;
      }

      registry.set(key, command);
    }
  }

  registry.maxDepth = maxDepth;
  return registry;
}

function resolveCommand(registry, tokens) {
  const originalTokens = Array.isArray(tokens)
    ? tokens.map((token) => String(token || '').trim()).filter(Boolean)
    : String(tokens || '').split(/\s+/).filter(Boolean);

  const maxDepth = Math.min(registry.maxDepth || 1, originalTokens.length);

  for (let depth = maxDepth; depth >= 1; depth -= 1) {
    const key = normalizeCommandKey(originalTokens.slice(0, depth).join(' '));
    const command = registry.get(key);

    if (command) {
      return {
        key,
        command,
        args: originalTokens.slice(depth),
        consumedTokens: depth
      };
    }
  }

  return null;
}

function getUniqueCommands(registry) {
  const uniqueCommands = [];
  const seen = new Set();

  for (const command of registry.values()) {
    const name = command.meta?.name;

    if (!name || seen.has(name)) {
      continue;
    }

    seen.add(name);
    uniqueCommands.push(command);
  }

  return uniqueCommands;
}

function groupCommandsByCategory(commands) {
  return commands.reduce((accumulator, command) => {
    const category = command.meta?.category || 'system';
    accumulator[category] = accumulator[category] || [];
    accumulator[category].push(command);
    return accumulator;
  }, {});
}

function formatCommandLabel(value) {
  return normalizeCommandKey(value);
}

module.exports = {
  normalizeCommandKey,
  getCommandKeys,
  buildRegistry,
  resolveCommand,
  getUniqueCommands,
  groupCommandsByCategory,
  formatCommandLabel
};
