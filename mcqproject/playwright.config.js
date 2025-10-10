/* eslint-env node */
/* global process */
import { defineConfig, devices } from '@playwright/test';

const DEFAULT_PORT = 59222;
const port = Number(process.env.VITE_PORT) || DEFAULT_PORT;
const baseUrlEnv = process.env.PLAYWRIGHT_BASE_URL;
const BASE_URL = baseUrlEnv ? baseUrlEnv : 'http://127.0.0.1:' + port;

export default defineConfig({
  testDir: './playwright/tests',
  outputDir: 'artifacts/e2e/results',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/e2e/report', open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'off',
    screenshot: 'only-on-failure',
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    actionTimeout: 15000,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port ' + port,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
