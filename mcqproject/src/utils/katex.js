let katexLoaded = false;

export function ensureKatex() {
  if (katexLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    const cssId = 'katex-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
      document.head.appendChild(link);
    }
    const jsId = 'katex-js';
    if (window.katex) {
      katexLoaded = true; resolve(); return;
    }
    if (!document.getElementById(jsId)) {
      const s = document.createElement('script');
      s.id = jsId;
      s.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';
      s.onload = () => { katexLoaded = true; resolve(); };
      document.head.appendChild(s);
    } else {
      // already loading
      const check = setInterval(() => { if (window.katex) { clearInterval(check); katexLoaded = true; resolve(); } }, 50);
    }
  });
}

// Basic Markdown + KaTeX renderer. Supports **bold**, *italic*, `code`, [link](url), and $inline$ math.
export function renderMDKaTeX(text = '') {
  let html = String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
             .replace(/\*(.+?)\*/g, '<em>$1</em>')
             .replace(/`([^`]+)`/g, '<code>$1</code>')
             .replace(/\[(.*?)\]\((https?:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // KaTeX inline $...$
  const parts = html.split(/\$(.+?)\$/g); // keep content groups
  if (parts.length > 1 && window.katex) {
    for (let i = 1; i < parts.length; i += 2) {
      try {
        parts[i] = window.katex.renderToString(parts[i], { throwOnError: false, output: 'html' });
      } catch { /* ignore */ }
    }
    html = parts.join('');
  }
  return html;
}

