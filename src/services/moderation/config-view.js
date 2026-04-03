const RULE_DEFINITIONS = [
  { key: 'spam', labelKey: 'automod.features.spam' },
  { key: 'duplicate', labelKey: 'automod.features.duplicate' },
  { key: 'link', labelKey: 'automod.features.link' },
  { key: 'invite', labelKey: 'automod.features.invite' },
  { key: 'badwords', labelKey: 'automod.features.badwords' },
  { key: 'caps', labelKey: 'automod.features.caps' },
  { key: 'mention', labelKey: 'automod.features.mention' },
  { key: 'webhook', labelKey: 'automod.features.webhook' },
  { key: 'selfbot', labelKey: 'automod.features.selfbot' },
  { key: 'botRaid', labelKey: 'automod.features.botRaid' }
];

const ACTION_DEFINITIONS = [
  { key: 'deleteMessage', labelKey: 'automod.actions.deleteMessage' },
  { key: 'autowarn', labelKey: 'automod.actions.autowarn' }
];

function formatToggleState(enabled, t) {
  return enabled ? t('common.labels.on') : t('common.labels.off');
}

function buildRuleLines(config, t) {
  return RULE_DEFINITIONS.map(({ key, labelKey }) => {
    const enabled = Boolean(config.rules?.[key]);
    const suffix =
      key === 'mention' && enabled && config.limits?.mentionMax
        ? ` (${config.limits.mentionMax})`
        : '';

    return `${formatToggleState(enabled, t).toUpperCase()} • ${t(labelKey)}${suffix}`;
  });
}

function buildActionLines(config, t) {
  return ACTION_DEFINITIONS.map(({ key, labelKey }) => {
    const enabled = Boolean(config.actions?.[key]);
    return `${formatToggleState(enabled, t).toUpperCase()} • ${t(labelKey)}`;
  });
}

function buildThresholdLines(config, t) {
  const thresholds = Array.isArray(config.thresholds) ? [...config.thresholds] : [];
  if (thresholds.length === 0) {
    return [t('automod.responses.noThresholds')];
  }

  return thresholds
    .sort((left, right) => left.warns - right.warns)
    .map((rule) =>
      t('automod.responses.thresholdLine', {
        warns: rule.warns,
        action: t(`automod.actions.${rule.action}`),
        duration:
          rule.duration == null ? t('automod.labels.notSet') : `${Number(rule.duration)}s`
      })
    );
}

function countEnabledRules(config) {
  return RULE_DEFINITIONS.filter(({ key }) => Boolean(config.rules?.[key])).length;
}

module.exports = {
  RULE_DEFINITIONS,
  ACTION_DEFINITIONS,
  formatToggleState,
  buildRuleLines,
  buildActionLines,
  buildThresholdLines,
  countEnabledRules
};
