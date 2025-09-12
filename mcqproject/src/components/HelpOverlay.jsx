import Modal from './Modal.jsx';
import { loadKeymap } from '../utils/keymap.js';

export default function HelpOverlay({ open, onClose }) {
  const keymap = loadKeymap();
  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts"
      footer={[<button key="close" className="btn-ghost" onClick={onClose}>Close</button>]}
    >
      <ul style={{listStyle:'none',padding:0,margin:0,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
        <li><span className="kbd">{keymap.options.join(' ')}</span> select/toggle option</li>
        <li><span className="kbd">{keymap.next}</span> submit / next</li>
        <li><span className="kbd">{keymap.prev} / {keymap.nextAlt}</span> navigate</li>
        <li><span className="kbd">{keymap.help}</span> help overlay</li>
        <li><span className="kbd">{keymap.close}</span> close modals</li>
      </ul>
    </Modal>
  );
}

