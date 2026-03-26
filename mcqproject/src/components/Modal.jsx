import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, footer }) {
  const boxRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => {
      const firstFocusable = boxRef.current?.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      (firstFocusable || boxRef.current)?.focus();
    });
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKeyDown);
      lastFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal" role="presentation" onClick={onClose}>
      <div
        ref={boxRef}
        className="box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ minWidth: 320 }}
      >
        {title && <h3 id={titleId} style={{ marginTop: 0 }}>{title}</h3>}
        <div>{children}</div>
        {footer && <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

