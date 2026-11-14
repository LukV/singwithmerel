import { expect, test, type Page } from '@playwright/test';

// Rounds take real time on the audio clock: exercise 1 is two passes of eight notes at 90 per minute.
test.setTimeout(60_000);
test.use({ viewport: { width: 1280, height: 860 } });

async function begin(page: Page) {
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Start' }).first().click();
}

const card = (page: Page, n: number) => page.locator(`#c${n}`);
const filledDots = (page: Page, n: number) => card(page, n).locator('.dot--on');

test('one full round of exercise 1 fills a dot, and a reload keeps it', async ({ page }) => {
  await begin(page);
  await card(page, 1).getByRole('button', { name: 'Start' }).click();
  await expect(card(page, 1).locator('.card__status')).toHaveText('Listen.');
  await expect(card(page, 1).locator('.merel')).toHaveAttribute('data-pose', 'singing');
  // The staff marks the notes as Merel sings them.
  await expect(page.locator('.staff__note.is-on')).toHaveCount(1, { timeout: 5_000 });
  await expect(card(page, 1).locator('.card__status')).toHaveText('Sing along.', { timeout: 15_000 });
  await expect(filledDots(page, 1)).toHaveCount(1, { timeout: 15_000 });
  await expect(card(page, 1).getByRole('button', { name: 'Next round' })).toBeVisible({ timeout: 5_000 });
  await expect(card(page, 1).locator('.merel')).toHaveAttribute('data-pose', 'listening');

  await page.reload();
  await expect(filledDots(page, 1)).toHaveCount(1);
});

test('skip opens the next level; the progress code brings progress back in a cleared browser', async ({ page, context }) => {
  await begin(page);
  await card(page, 1).getByRole('button', { name: 'Skip this level' }).click();
  await expect(card(page, 1)).toHaveAttribute('data-state', 'completed');
  await expect(card(page, 2)).toHaveAttribute('data-state', 'active');
  await expect(card(page, 1).locator('.card__status')).toHaveText('Skipped.');

  const code = await page.locator('#progress-code').inputValue();
  expect(code).toMatch(/^m[01]\./);

  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(card(page, 1)).toHaveAttribute('data-state', 'active');

  await page.locator('#progress-paste').fill('not a code');
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(page.locator('.progress__note')).toContainText('does not work');

  await page.locator('#progress-paste').fill(code);
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(page.locator('.progress__note')).toHaveText('Your progress is back.');
  await expect(card(page, 2)).toHaveAttribute('data-state', 'active');
  await page.reload();
  await expect(card(page, 2)).toHaveAttribute('data-state', 'active');
});

test('recognition: up or down, then the notes on the keys; a wrong key shows and lets you try again', async ({ page }) => {
  await begin(page);
  for (const n of [1, 2, 3]) await card(page, n).getByRole('button', { name: 'Skip this level' }).click();
  await expect(card(page, 4)).toHaveAttribute('data-state', 'active');
  await card(page, 4).getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.staff__note')).toHaveCount(0);

  const status = card(page, 4).locator('.card__status');
  await expect(status).toHaveText('Up or down?', { timeout: 10_000 });
  await expect(card(page, 4).locator('.merel')).toHaveAttribute('data-pose', 'thinking');
  // Answer both steps, trying the other way after a wrong answer.
  for (const next of ['And the next step?', 'Find the notes.']) {
    await card(page, 4).getByRole('button', { name: 'Up' }).click();
    if ((await status.textContent()) !== next) await card(page, 4).getByRole('button', { name: 'Down' }).click();
    await expect(status).toHaveText(next);
  }

  // Find each note by trying the keys from low do upwards.
  const found = page.locator('.staff__note.is-found');
  let wrongSeen = false;
  for (let n = 1; n <= 3; n++) {
    for (const key of 'asdfghjk') {
      await page.keyboard.press(key);
      if ((await found.count()) === n) break;
      wrongSeen = true;
      await expect(page.locator('.staff__ghost')).toHaveCount(1);
      await expect(status).toHaveText(/^Not /);
    }
    await expect(found).toHaveCount(n);
  }
  expect(wrongSeen).toBe(true);
  await expect(filledDots(page, 4)).toHaveCount(1);
  await expect(status).toHaveText('Bravo.');
});
