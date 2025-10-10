import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { capture, registerStandardHooks } from './helpers.js';

registerStandardHooks(test);

test('home page renders and passes basic accessibility scan', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { level: 1, name: /MCQ Practice/i })).toBeVisible();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations, 'Home page should have no critical accessibility violations')
    .toEqual([]);
  await capture(page, 'artifacts/e2e/screenshots/home.png');
});
