export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="box" onClick={(e) => e.stopPropagation()} style={{ minWidth: 320 }}>
        {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
        <div>{children}</div>
        {footer && <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

