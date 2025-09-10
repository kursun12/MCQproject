export function loadState() {
  try {
    return JSON.parse(localStorage.getItem('quizState')) || {};
  } catch {
    return {};
  }
}

export function saveState(state) {
  localStorage.setItem('quizState', JSON.stringify(state));
}
