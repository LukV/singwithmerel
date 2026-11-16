import { expect, test } from '@playwright/test';

// Merel listening, with Chromium's fake microphone singing the scale over and over, once in a
// while with re instead of mi (fake-mic.ts; playwright.config.ts, project `listening`). A round
// takes real time on the audio clock.
test.setTimeout(150_000);
test.use({ viewport: { width: 1280, height: 860 } });

test('Merel asks once, listens in Your turn, the voice dot follows, a miss starts again from do, and the last note completes the round', async ({ page }) => {
  // Keep the microphone's tracks, to see that they are closed after Your turn.
  await page.addInitScript(() => {
    const tracks: MediaStreamTrack[] = [];
    (window as unknown as { __tracks: MediaStreamTrack[] }).__tracks = tracks;
    const open = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (c) => {
      const stream = await open(c);
      tracks.push(...stream.getTracks());
      return stream;
    };
  });
  const liveTracks = () => page.evaluate(() => (window as unknown as { __tracks: MediaStreamTrack[] }).__tracks.filter((t) => t.readyState === 'live').length);

  await page.goto('/en/');
  await page.getByRole('button', { name: 'Start' }).first().click();
  const card = page.locator('#c1');
  await card.getByRole('button', { name: 'Start' }).click();
  await expect(card.locator('.card__status')).toHaveText('Sing along.', { timeout: 15_000 });
  // Merel does not listen while he sings.
  expect(await liveTracks()).toBe(0);

  await expect(card.locator('.card__ask')).toContainText('Your voice stays on this device.', { timeout: 15_000 });
  await card.getByRole('button', { name: 'Let him listen' }).click();
  await expect(card.locator('.card__status')).toHaveText('Your turn. Sing it alone; Merel listens.');
  await expect(card.locator('.merel')).toHaveAttribute('data-pose', 'listening');
  await expect.poll(liveTracks, { timeout: 10_000 }).toBe(1);

  // The notes to sing are outlined; the voice dot shows on the staff, and the notes found fill in their colour.
  await expect(page.locator('.staff__note.is-next')).toHaveCount(1);
  await expect(page.locator('.staff__voice:not(.is-silent)')).toHaveCount(1, { timeout: 10_000 });
  await expect(page.locator('.staff__note.is-found')).not.toHaveCount(0, { timeout: 10_000 });
  await expect(card.locator('.dot--on')).toHaveCount(0);

  // Off key, a try misses: Merel says so mildly, and you sing again from do, every note outlined again.
  await expect(card.locator('.card__status')).toContainText('Almost. Sing it again from do.', { timeout: 30_000 });
  await expect(page.locator('.staff__note.is-found')).toHaveCount(0);
  await expect(card.locator('.dot--on')).toHaveCount(0);

  // The last note completes the round: a dot, Merel bows, the microphone is closed.
  await expect(card.locator('.dot--on')).toHaveCount(1, { timeout: 30_000 });
  await expect(card.locator('.merel')).toHaveAttribute('data-pose', 'bowing');
  await expect(page.locator('.staff__note.is-found')).toHaveCount(8);
  await expect(page.locator('.staff__voice')).toHaveCount(0);
  await expect.poll(liveTracks).toBe(0);

  // The next round listens without asking again.
  await card.getByRole('button', { name: 'Next round' }).click({ timeout: 5_000 });
  await expect(card.locator('.card__status')).toHaveText('Your turn. Sing it alone; Merel listens.', { timeout: 30_000 });
  await expect(card.locator('.card__ask')).toHaveCount(0);
  await expect(card.locator('.dot--on')).toHaveCount(2, { timeout: 40_000 });
});

test('recognition does not ask for the microphone', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Start' }).first().click();
  for (const n of [1, 2, 3]) await page.locator(`#c${n}`).getByRole('button', { name: 'Skip this level' }).click();
  const card = page.locator('#c4');
  await card.getByRole('button', { name: 'Start' }).click();
  await expect(card.locator('.card__status')).toHaveText('Up or down?', { timeout: 10_000 });
  await expect(card.locator('.card__ask')).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Let Merel listen' })).toHaveCount(0);
});
