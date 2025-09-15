import { useRef, useState } from 'react';

// Minimal hotspot renderer: image with rectangular zones [{x,y,w,h}] in percentages
export default function Hotspot({ src, zones = [], onSelect, selected = [] }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);

  const handleClick = (e) => {
    const img = ref.current;
    if (!img) return;
    const r = img.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 100;
    const py = ((e.clientY - r.top) / r.height) * 100;
    // Find first zone containing point
    const idx = zones.findIndex((z) => px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h);
    if (idx >= 0) onSelect(idx);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img ref={ref} src={src} alt="hotspot" style={{ maxWidth: '100%', borderRadius: 8 }} onClick={handleClick}
        onMouseMove={(e) => {
          const img = ref.current;
          if (!img) return;
          const r = img.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * 100;
          const py = ((e.clientY - r.top) / r.height) * 100;
          const idx = zones.findIndex((z) => px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h);
          setHover(idx);
        }}
        onMouseLeave={() => setHover(null)}
      />
      {zones.map((z, i) => (
        <div key={i} style={{ position: 'absolute', left: z.x + '%', top: z.y + '%', width: z.w + '%', height: z.h + '%',
          border: selected.includes(i) ? '2px solid limegreen' : '2px dashed rgba(255,255,255,.5)', borderRadius: 4,
          boxShadow: hover === i ? '0 0 0 3px rgba(37,99,235,.35)' : 'none' }} aria-hidden="true" />
      ))}
    </div>
  );
}

