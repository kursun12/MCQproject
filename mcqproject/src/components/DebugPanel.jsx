import { useEffect, useMemo, useState } from 'react';
import { getDebugEvents, subscribeDebugEvents } from '../utils/debug.js';

const IS_DEV = import.meta.env.DEV;
const MAX_SHOWN = 50;

function formatDuration(duration) {
  if (typeof duration !== 'number') return '';
  return duration.toFixed(1) + 'ms';
}

function summarize(event) {
  if (event.type === 'network') {
    const parts = [];
    if (event.method) parts.push(event.method);
    if (event.url) parts.push(event.url);
    if (event.status !== undefined) parts.push('→ ' + event.status);
    if (event.duration !== undefined) parts.push('(' + formatDuration(event.duration) + ')');
    if (event.error) parts.push('⚠ ' + event.error);
    return parts.join(' ');
  }
  if (event.type === 'error') {
    return event.message || 'Unhandled error';
  }
  return event.type;
}

function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState(() => getDebugEvents());

  useEffect(() => {
    if (!IS_DEV) return undefined;
    return subscribeDebugEvents((items) => {
      const slice = items.slice(-MAX_SHOWN);
      setEvents(slice);
    });
  }, []);

  const containerClass = useMemo(
    () => 'debug-panel' + (open ? ' debug-panel--open' : ''),
    [open],
  );

  if (!IS_DEV) return null;

  return (
    <div className={containerClass}>
      <button
        type="button"
        className="debug-panel__toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        Debug ({events.length})
      </button>
      {open ? (
        <div className="debug-panel__body" role="log">
          {events.length === 0 ? (
            <div className="debug-panel__empty">No events yet.</div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={'debug-panel__row debug-panel__row--' + event.type}
              >
                <div className="debug-panel__meta">
                  <span className="debug-panel__time">
                    {new Date(event.ts).toLocaleTimeString()}
                  </span>
                  <span className="debug-panel__type">{event.type}</span>
                </div>
                <div className="debug-panel__content">
                  <div className="debug-panel__summary">{summarize(event)}</div>
                  {event.stack ? (
                    <details>
                      <summary>Stack</summary>
                      <pre>{event.stack}</pre>
                    </details>
                  ) : null}
                  {event.payload ? (
                    <details>
                      <summary>Payload</summary>
                      <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                    </details>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default DebugPanel;
