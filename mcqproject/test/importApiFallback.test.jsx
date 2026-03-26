import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../src/utils/debug.js', () => ({
  logDebugEvent: vi.fn(),
}));

async function renderImport() {
  vi.resetModules();
  const { default: ImportQuestions } = await import('../src/Import.jsx');
  return render(
    <MemoryRouter>
      <ImportQuestions />
    </MemoryRouter>,
  );
}

function mockJsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
    clone() {
      return this;
    },
    text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
  };
}

function expectAnyImportButtonEnabled() {
  const buttons = screen.getAllByRole('button', { name: /Import JSON/i });
  expect(buttons.some((button) => !button.disabled)).toBe(true);
}

describe('ImportQuestions optional API fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('VITE_API_BASE_URL', '');
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('stays usable without probing the server when no API is configured', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    await renderImport();

    expect(await screen.findByText(/Server import is optional/i)).toBeVisible();
    expectAnyImportButtonEnabled();
    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(fetch).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('shows an unreachable message, keeps the UI usable, and logs the failed request in dev', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:39999');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED'));

    await renderImport();

    expect(await screen.findByText(/Unable to reach the optional server import API right now/i)).toBeVisible();
    expectAnyImportButtonEnabled();
    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:39999/api/questionsets', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    expect(infoSpy).not.toHaveBeenCalled();
    expect(
      errorSpy.mock.calls.some((call) => String(call[0]).includes('[api] GET http://127.0.0.1:39999/api/questionsets')),
    ).toBe(true);
  });

  it('shows an empty-bank message without breaking the page when the API returns an empty list', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:41001');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue(mockJsonResponse([]));

    await renderImport();

    expect(await screen.findByText(/no server-hosted question banks were found/i)).toBeVisible();
    expectAnyImportButtonEnabled();
    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(
      infoSpy.mock.calls.some((call) => String(call[0]).includes('[api] GET http://127.0.0.1:41001/api/questionsets')),
    ).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('shows an unexpected-response message without breaking the page when the API payload is invalid', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:41002');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue(mockJsonResponse({ sets: [] }));

    await renderImport();

    expect(await screen.findByText(/returned an unexpected response/i)).toBeVisible();
    expectAnyImportButtonEnabled();
    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(
      infoSpy.mock.calls.some((call) => String(call[0]).includes('[api] GET http://127.0.0.1:41002/api/questionsets')),
    ).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
