const events = [];
const listeners = new Set();
const MAX_EVENTS = 200;
let initialized = false;

function notify() {
  const snapshot = events.slice();
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (err) {
      console.error('Debug listener error', err);
    }
  });
}

function pushEvent(event) {
  events.push(event);
  if (events.length > MAX_EVENTS) events.shift();
  notify();
}

function safeSerialize(value) {
  if (value instanceof Error) {
    return {
      message: value.message,
      stack: value.stack,
      name: value.name,
    };
  }
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }
  return value;
}

function createEvent(type, payload = {}) {
  const now = new Date();
  const idPart = Math.random().toString(16).slice(2, 8);
  return {
    id: String(now.getTime()) + '-' + idPart,
    type,
    ts: now.toISOString(),
    ...payload,
  };
}

export function logDebugEvent(type, payload = {}) {
  const event = createEvent(type, {
    ...payload,
    payload: payload && Object.prototype.hasOwnProperty.call(payload, 'payload')
      ? safeSerialize(payload.payload)
      : undefined,
  });
  if (import.meta.env.DEV) {
    const level = type === 'error' ? 'error' : 'info';
    console[level]('[debug]', type, payload);
  }
  pushEvent(event);
  return event;
}

export function subscribeDebugEvents(listener) {
  listeners.add(listener);
  listener(events.slice());
  return () => {
    listeners.delete(listener);
  };
}

export function getDebugEvents() {
  return events.slice();
}

function captureError(event, source) {
  const errorPayload = {
    source,
    message:
      (event && event.message) ||
      (event && event.reason && event.reason.message) ||
      'Unknown error',
    stack:
      (event && event.error && event.error.stack) ||
      (event && event.reason && event.reason.stack),
  };
  logDebugEvent('error', errorPayload);
}

function ensureGlobalListeners() {
  if (initialized || typeof window === 'undefined') return;
  window.addEventListener('error', (event) => captureError(event, 'error'));
  window.addEventListener('unhandledrejection', (event) =>
    captureError(event, 'unhandledrejection'),
  );
  initialized = true;
}

ensureGlobalListeners();
