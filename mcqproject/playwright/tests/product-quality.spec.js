import { expect, test } from '@playwright/test';
import { registerStandardHooks } from './helpers.js';

registerStandardHooks(test);

test('quick-set chips remain legible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const firstQuickSet = page.locator('button.chip').first();
  await expect(firstQuickSet).toBeVisible();

  const styles = await firstQuickSet.evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      text: element.textContent?.trim() || '',
    };
  });

  expect(styles.text.length).toBeGreaterThan(0);
  expect(styles.color).not.toBe(styles.backgroundColor);
});

test('import and settings stay within the viewport at common tablet and phone widths', async ({ page }) => {
  const widths = [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ];

  for (const viewport of widths) {
    await page.setViewportSize(viewport);

    for (const route of ['/import', '/settings']) {
      await page.goto(route);
      const overflow = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect.soft(
        overflow.scrollWidth,
        `${route} overflowed at ${viewport.width}x${viewport.height}`,
      ).toBeLessThanOrEqual(overflow.innerWidth);
    }
  }
});

test('review shows a clear empty state when no session exists', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('mcqSession');
    localStorage.removeItem('bookmarks');
  });

  await page.goto('/review');
  await expect(page.getByText(/No completed session is available yet/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Start a practice quiz/i })).toBeVisible();
});

test('quiz utility buttons expose accessible names', async ({ page }) => {
  await page.goto('/quiz?mode=practice&setId=sc200-set-1&count=10');
  await expect(page.getByRole('button', { name: 'Bookmark question' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add note to question' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit question' })).toBeVisible();
});
