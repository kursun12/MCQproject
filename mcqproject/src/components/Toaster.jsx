import { useEffect, useState } from 'react';

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const t = { id: Date.now() + Math.random(), text: e.detail?.text || String(e.detail) };
      setToasts((arr) => [...arr, t]);
      setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== t.id)), e.detail?.duration || 2400);
    };
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, []);

  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>{t.text}</div>
      ))}
    </div>
  );
}

