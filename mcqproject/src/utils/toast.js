export function toast(text, duration = 2400) {
  try {
    const event = new CustomEvent('app:toast', { detail: { text, duration } });
    window.dispatchEvent(event);
  } catch {
    // fallback
    console.log('[toast]', text);
  }
}

