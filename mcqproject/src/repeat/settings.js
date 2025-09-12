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

export function loadRepeatSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem('repeatAdaptiveSettings') || 'null');
    return { ...DEFAULT_REPEAT_SETTINGS, ...(raw || {}) };
  } catch {
    return DEFAULT_REPEAT_SETTINGS;
  }
}

export function saveRepeatSettings(s) {
  try { localStorage.setItem('repeatAdaptiveSettings', JSON.stringify(s)); } catch { /* empty */ }
}

