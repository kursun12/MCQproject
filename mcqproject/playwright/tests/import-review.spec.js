import { expect, test } from '@playwright/test';
import { registerStandardHooks } from './helpers.js';

registerStandardHooks(test);

test('import screen stays graceful when optional API is not configured', async ({ page }) => {
  const consoleMessages = [];
  page.on('console', (msg) => {
    consoleMessages.push(msg.text());
  });

  await page.goto('/import');
  await expect(page.getByText(/Server import is optional/i)).toBeVisible();

  expect(consoleMessages.filter((msg) => msg.includes('/api/questionsets'))).toEqual([]);
});

test('assigning a question to a bundled string-id set persists membership', async ({ page }) => {
  await page.goto('/import');

  const assignmentSelect = page.locator('select[aria-label^="Assign question"]').first();
  await assignmentSelect.selectOption('sc200-set-2');

  await expect.poll(async () => page.evaluate(() => {
    const questions = JSON.parse(localStorage.getItem('questions') || '[]');
    const sets = JSON.parse(localStorage.getItem('sets') || '[]');
    const firstId = questions[0]?.id;
    return (sets.find((set) => set.id === 'sc200-set-2')?.questionIds || []).includes(firstId);
  })).toBe(true);
});

test('review shows the correct answer text for normalized questions', async ({ page }) => {
  await page.goto('/');
  const seeded = await page.evaluate(() => {
    const questions = JSON.parse(localStorage.getItem('questions') || '[]');
    const [first] = questions;
    const correctIndexes = Array.isArray(first.answers)
      ? first.answers
      : Array.isArray(first.answer)
      ? first.answer
      : [first.answer];
    const wrongIndex = first.options.findIndex((_, index) => !correctIndexes.includes(index));
    const payload = {
      mode: 'practice',
      current: 1,
      finished: true,
      questions: [first],
      results: [{ index: 0, selected: [wrongIndex >= 0 ? wrongIndex : 0], isCorrect: false }],
      bookmarks: [],
      notes: {},
      score: 0,
      points: 0,
      times: [12.3],
    };
    localStorage.setItem('mcqSession', JSON.stringify(payload));
    return {
      correctNeedle: 'ActionType == "LogonFailed"',
    };
  });

  await page.getByRole('link', { name: 'Review', exact: true }).click();
  await expect(page).toHaveURL(/\/review$/);
  await page.locator('.question-card .qc-header').first().click();
  await expect(page.locator('.qc-extra')).toContainText('Correct:');
  const rendered = await page.evaluate(() => Array.from(
    document.querySelectorAll('.qc-extra span'),
  ).map((element) => element.textContent || ''));
  expect(rendered[1]).toContain(seeded.correctNeedle);
  expect(rendered[0]).not.toContain(seeded.correctNeedle);
  expect(rendered[1]).not.toEqual(rendered[0]);
});

test('settings display migrated repeat defaults using the current config keys', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('repeatAdaptiveSettings', JSON.stringify({
      masteryType: 'streak',
      target: 4,
    }));
  });

  await page.goto('/settings');
  await expect(page.getByLabel('Mastery type')).toHaveValue('consecutive');
  await expect(page.getByLabel('Target')).toHaveValue('4');
});
