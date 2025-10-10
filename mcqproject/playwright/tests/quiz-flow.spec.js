import { expect, test } from '@playwright/test';
import { registerStandardHooks } from './helpers.js';

registerStandardHooks(test);

async function answerQuestion(page) {
  const choice = page.locator('.option label').first();
  await choice.scrollIntoViewIfNeeded();
  await choice.click();
  let button = page.getByRole('button', { name: /Reveal|Next|Finish|Save/ }).first();
  await button.click();
  await page.waitForTimeout(150);
  button = page.getByRole('button', { name: /Next|Finish|Save/ }).first();
  if (await button.isEnabled()) {
    await button.click();
    await page.waitForTimeout(150);
  }
}

test('user can complete a short practice quiz', async ({ page }) => {
  await page.goto('/quiz?mode=practice&setId=all&count=2');
  await page.waitForSelector('text=Question 1 of');
  await expect(page.locator('.scoreboard')).toContainText('Score');
  await answerQuestion(page);
  await expect(page.locator('text=Question 2 of')).toBeVisible();
  await answerQuestion(page);
  await expect(page.getByRole('heading', { name: 'Your Results' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Restart$/ }).first()).toBeVisible();
});
