export const DEFAULT_REPEAT_SETTINGS = {
  masteryType: 'consecutive',
  masteryTarget: 2,
  strictMultiAnswer: true,
  partialCreditMode: false,
  cooldownSeconds: 30,
  maxBackToBackRepeats: 1,
  sessionMaxRepeatsPerItem: 10,
  leechThreshold: 5,
  leechAction: 'delay', // delay | explainFirst | extraHints | suspend
  spacingCurve: 'short', // none | short | leitner-lite
  allowConfidenceButtons: false,
  autoRevealExplanationOnError: true,
  autoSkipOnWrong: false,
  showSelectAllBadge: true,
};

function normalizeMasteryType(value) {
  if (value === 'streak') return 'consecutive';
  if (value === 'ratio' || value === 'consecutive') return value;
  return DEFAULT_REPEAT_SETTINGS.masteryType;
}

export function normalizeRepeatSettings(rawSettings = {}) {
  const normalized = {
    ...DEFAULT_REPEAT_SETTINGS,
    ...(rawSettings || {}),
  };
  normalized.masteryType = normalizeMasteryType(rawSettings?.masteryType);
  normalized.masteryTarget = Number.isFinite(Number(rawSettings?.masteryTarget))
    ? Number(rawSettings.masteryTarget)
    : Number.isFinite(Number(rawSettings?.target))
    ? Number(rawSettings.target)
    : DEFAULT_REPEAT_SETTINGS.masteryTarget;
  return normalized;
}

export function loadRepeatSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem('repeatAdaptiveSettings') || 'null');
    return normalizeRepeatSettings(raw || {});
  } catch {
    return { ...DEFAULT_REPEAT_SETTINGS };
  }
}

export function saveRepeatSettings(s) {
  try {
    localStorage.setItem('repeatAdaptiveSettings', JSON.stringify(normalizeRepeatSettings(s)));
  } catch {
    /* empty */
  }
}

