/* eslint-env node */
import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [plugin()],
  server: {
    port: 59222,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setupTests.js',
    exclude: ['playwright/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'artifacts/coverage',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'playwright/**',
        'artifacts/**',
        'public/**',
        'server.js',
        'playwright.config.js',
      ],
    },
  },
});
