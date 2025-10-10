import { expect, test } from '@playwright/test';
import { registerStandardHooks } from './helpers.js';

registerStandardHooks(test);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

const routes = [
  { link: 'Quiz', badge: 'Quiz', path: '/quiz' },
  { link: 'Repeat', badge: 'Repeat', path: '/repeat' },
  { link: 'Review', badge: 'Review', path: '/review' },
  { link: 'Bookmarks', badge: 'Review', path: '/review?bookmarks=1' },
  { link: 'Settings', badge: 'Settings', path: '/settings' },
  { link: 'Questions', badge: 'Import', path: '/import' },
];

for (const route of routes) {
  test(`nav link ${route.link} renders ${route.badge}`, async ({ page }) => {
    await page.getByRole('link', { name: route.link, exact: true }).click();
    await page.waitForURL('**' + route.path);
    await page.waitForFunction(
      (expected) => {
        const badge = document.querySelector('.mode-badge');
        return Boolean(badge && badge.textContent && badge.textContent.includes(expected));
      },
      route.badge,
    );
    await expect.poll(async () => {
      const current = new URL(page.url());
      return `${current.pathname}${current.search}`;
    }).toContain(route.path);
  });
}
