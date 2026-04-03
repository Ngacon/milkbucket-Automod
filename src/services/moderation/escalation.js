const DEFAULT_ESCALATION_THRESHOLDS = [
  { warns: 3, action: 'timeout', duration: 300 },
  { warns: 5, action: 'mute', duration: 900 },
  { warns: 7, action: 'kick', duration: null },
  { warns: 10, action: 'ban', duration: null }
];

function normalizeThresholds(thresholds = DEFAULT_ESCALATION_THRESHOLDS) {
  return [...thresholds]
    .map((rule) => ({
      warns: Number(rule.warns),
      action: String(rule.action || '').toLowerCase(),
      duration: rule.duration == null ? null : Number(rule.duration)
    }))
    .filter((rule) => Number.isFinite(rule.warns) && rule.warns > 0 && rule.action)
    .sort((left, right) => left.warns - right.warns);
}

function resolveEscalationRule({ warnCount, thresholds }) {
  const normalized = normalizeThresholds(thresholds);

  return (
    [...normalized]
      .sort((left, right) => right.warns - left.warns)
      .find((rule) => warnCount >= rule.warns) || null
  );
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
