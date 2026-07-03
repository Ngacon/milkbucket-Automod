const DEFAULT_ESCALATION_THRESHOLDS = [
  { warns: 3, action: 'timeout', duration: 300, message: null },
  { warns: 5, action: 'mute', duration: 900, message: null },
  { warns: 7, action: 'kick', duration: null, message: null },
  { warns: 10, action: 'ban', duration: null, message: null }
];

function normalizeThresholds(thresholds = DEFAULT_ESCALATION_THRESHOLDS) {
  return [...thresholds]
    .map((rule) => ({
      warns: Number(rule.warns),
      action: String(rule.action || '').toLowerCase(),
      duration: rule.duration == null ? null : Number(rule.duration),
      message: rule.message || null
    }))
    .filter((rule) => Number.isFinite(rule.warns) && rule.warns > 0 && rule.action)
    .sort((left, right) => left.warns - right.warns);
}

function resolveEscalationRule({ warnCount, thresholds }) {
  const normalized = normalizeThresholds(thresholds);

  // Iterate from highest to lowest threshold without re-sorting
  for (let i = normalized.length - 1; i >= 0; i--) {
    if (warnCount >= normalized[i].warns) {
      return normalized[i];
    }
  }

  return null;
}

function buildEscalationKey(guildId, userId, warns) {
  return `moderation-escalation:${guildId}:${userId}:${warns}`;
}

module.exports = {
  DEFAULT_ESCALATION_THRESHOLDS,
  normalizeThresholds,
  resolveEscalationRule,
  buildEscalationKey
};
