import Modal from './Modal.jsx';

export default function HelpOverlay({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts"
      footer={[<button key="close" className="btn-ghost" onClick={onClose}>Close</button>]}
    >
      <ul style={{listStyle:'none',padding:0,margin:0,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
        <li><span className="kbd">1–9</span> select/toggle option</li>
        <li><span className="kbd">Enter</span> submit / next</li>
        <li><span className="kbd">← / →</span> navigate</li>
        <li><span className="kbd">/</span> focus search</li>
        <li><span className="kbd">b</span> bookmark</li>
        <li><span className="kbd">?</span> help overlay</li>
        <li><span className="kbd">Esc</span> close modals</li>
      </ul>
    </Modal>
  );
}

