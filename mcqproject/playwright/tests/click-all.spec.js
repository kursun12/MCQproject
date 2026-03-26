import { expect, test } from '@playwright/test';
import { capture, ensureDir, registerStandardHooks, sanitizeFilename } from './helpers.js';

registerStandardHooks(test);

test.setTimeout(45000);

const ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/quiz', label: 'Quiz' },
  { path: '/settings', label: 'Settings' },
];

const MAX_INTERACTIONS = 3;
const SKIP_PATTERN = /(delete|remove|clear|reset|export|share|danger|destroy|erase)/i;

test('click-all exploratory pass keeps UI stable', async ({ page }) => {
  await ensureDir('artifacts/e2e/screenshots/click-all');

  await page.goto('/');

  for (const route of ROUTES) {
    if (route.path !== '/') {
      await Promise.all([
        page.waitForURL('**' + route.path),
        page.getByRole('link', { name: route.label, exact: true }).click(),
      ]);
    }

    let clicks = 0;
    for (let index = 0; clicks < MAX_INTERACTIONS; index += 1) {
      const elements = page.locator('button, [role="button"]');
      const total = await elements.count();
      if (index >= total) break;
      const control = elements.nth(index);
      let label = '';
      try {
        if (!(await control.isVisible())) continue;
        label = (await control.getAttribute('aria-label')) || (await control.innerText()) || '';
      } catch {
        continue;
      }
      const trimmed = label.trim();
      if (!trimmed || SKIP_PATTERN.test(trimmed)) continue;
      await control.scrollIntoViewIfNeeded();
      const baseName = sanitizeFilename((route.path || 'root') + '-' + trimmed);
      const basePath = 'artifacts/e2e/screenshots/click-all/' + baseName;
      await capture(page, basePath + '-before.png');
      await control.click({ timeout: 5000 });
      await page.waitForTimeout(200);
      await capture(page, basePath + '-after.png');
      clicks += 1;
    }
    await expect.poll(async () => page.url()).toContain(route.path);
  }
});
