import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/debug.js', () => ({
  logDebugEvent: vi.fn(),
}));

const { apiClient } = await import('../src/utils/apiClient.js');

describe('apiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs GET requests and returns JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ ok: true }),
    });

    const data = await apiClient.get('/example');

    expect(fetch).toHaveBeenCalledWith('/example', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    expect(data).toEqual({ ok: true });
  });

  it('throws structured error for non-2xx responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ message: 'fail' }),
      clone() {
        return this;
      },
      text: vi.fn().mockResolvedValue(JSON.stringify({ message: 'fail' })),
    });

    await expect(apiClient.get('/error')).rejects.toMatchObject({
      status: 500,
      payload: { message: 'fail' },
    });
  });

  it('logs network failure when fetch rejects', async () => {
    const error = new Error('network');
    globalThis.fetch = vi.fn().mockRejectedValue(error);

    await expect(apiClient.get('/boom')).rejects.toThrow('network');
  });
});

