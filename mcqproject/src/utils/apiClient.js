import { logDebugEvent } from './debug.js';

const baseFromEnv = (import.meta.env.VITE_API_BASE_URL || '').trim();
const baseUrl = baseFromEnv.endsWith('/') ? baseFromEnv.slice(0, -1) : baseFromEnv;

function buildUrl(path) {
  if (!path) return baseUrl || '/';
  if (/^https?:/i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : '/' + path;
  if (!baseUrl) return normalized;
  return baseUrl + normalized;
}

function shouldSerialize(body) {
  if (!body) return false;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return false;
  if (typeof body === 'string') return false;
  return typeof body === 'object';
}

async function parseErrorResponse(response) {
  const clone = response.clone();
  try {
    const text = await clone.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url = buildUrl(path);
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const init = { ...options, method };
  init.headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };
  if (shouldSerialize(options.body)) {
    init.body = JSON.stringify(options.body);
    init.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, init);
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = end - start;
    logDebugEvent('network', {
      method,
      url,
      status: response.status,
      ok: response.ok,
      duration,
    });
    if (import.meta.env.DEV) {
      const msg = '[api] ' + method + ' ' + url + ' → ' + response.status + ' (' + duration.toFixed(1) + 'ms)';      console.info(msg);
    }
    if (!response.ok) {
      const payload = await parseErrorResponse(response);
      const error = new Error('Request failed with status ' + response.status);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return response;
  } catch (error) {
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = end - start;
    logDebugEvent('network', {
      method,
      url,
      status: 'error',
      ok: false,
      duration,
      error: error.message,
    });
    if (import.meta.env.DEV) {
      const msg = '[api] ' + method + ' ' + url + ' → error (' + duration.toFixed(1) + 'ms)';      console.error(msg, error);
    }
    throw error;
  }
}

export async function apiJson(path, options) {
  const response = await apiRequest(path, options);
  return response.json();
}

export const apiClient = {
  get(path, options = {}) {
    return apiJson(path, { ...options, method: 'GET' });
  },
  post(path, body, options = {}) {
    return apiJson(path, { ...options, method: 'POST', body });
  },
  put(path, body, options = {}) {
    return apiJson(path, { ...options, method: 'PUT', body });
  },
  patch(path, body, options = {}) {
    return apiJson(path, { ...options, method: 'PATCH', body });
  },
  delete(path, options = {}) {
    return apiJson(path, { ...options, method: 'DELETE' });
  },
};
