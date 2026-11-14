import { expect, test } from '@playwright/test';

// Counts the tones the page starts, by frequency, so the check can hear what was played.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const played: number[] = [];
    (window as unknown as { __tones: number[] }).__tones = played;
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (this: OscillatorNode, ...args: [number?]) {
      played.push(Math.round(this.frequency.value * 100) / 100);
      return start.apply(this, args);
    };
  });
});

test('open /en, press Start and play sol with G', async ({ page, isMobile }) => {
  await page.goto('/en/');
  await expect(page.getByRole('img', { name: 'Merel', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).first().click();
  await expect(page.locator('#c1')).toBeInViewport();

  const instrument = page.getByRole('complementary', { name: 'The scale of do major' });
  await expect(instrument).toBeInViewport();
  await expect(instrument.getByRole('button')).toHaveCount(8);

  if (isMobile) {
    // No keyboard on a phone: tap the key.
    await instrument.getByRole('button', { name: /^sol, G/ }).tap();
  } else {
    await page.keyboard.press('g');
  }

  await expect(instrument.locator('.key[data-note="G4"]')).toHaveClass(/is-on/);
  await expect(instrument.locator('.staff__note[data-note="G4"]')).toHaveClass(/is-on/);
  await expect(instrument.locator('.instrument__note')).toHaveText('sol');
  expect(await page.evaluate(() => (window as unknown as { __tones: number[] }).__tones)).toContain(392);
});

test('the path follows the language, and the choice is kept', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('link', { name: 'FR' }).click();
  await expect(page).toHaveURL(/\/fr\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('.key[data-note="D4"] .key__name')).toHaveText('ré');
  await expect(page.locator('.key__letter')).toHaveCount(0);
  await page.goto('/');
  await expect(page).toHaveURL(/\/fr\/$/);
});

test('the phone keys are at least 44 px wide at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Start' }).first().click();
  const widths = await page.locator('.key').evaluateAll((keys) => keys.map((k) => k.getBoundingClientRect().width));
  expect(widths).toHaveLength(8);
  for (const w of widths) expect(w).toBeGreaterThanOrEqual(44);
  // Docked at the bottom, once it has slid up.
  await expect
    .poll(async () => {
      const box = await page.locator('.instrument').boundingBox();
      return Math.round(box!.y + box!.height);
    })
    .toBe(740);
});
