export const defaultKeymap = {
  options: ['1','2','3','4','5','6','7','8','9'],
  next: 'Enter',
  nextAlt: 'ArrowRight',
  prev: 'ArrowLeft',
  help: '?',
  close: 'Escape'
};

export function loadKeymap() {
  try {
    const raw = JSON.parse(localStorage.getItem('keymap'));
    if (raw && typeof raw === 'object') {
      return {
        ...defaultKeymap,
        ...raw,
        options: Array.isArray(raw.options) && raw.options.length
          ? raw.options
          : defaultKeymap.options
      };
    }
  } catch {
    // ignore
  }
  return { ...defaultKeymap };
}

export function saveKeymap(map) {
  localStorage.setItem('keymap', JSON.stringify(map));
}
