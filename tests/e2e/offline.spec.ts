import { expect, test } from '@playwright/test';

test('installable, and after the first visit Merel starts and plays offline', async ({ page, context }) => {
  await page.goto('/en/');
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="manifest"]')?.getAttribute('href');
    return href ? ((await (await fetch(href)).json()) as { name: string; icons: { sizes: string }[] }) : null;
  });
  expect(manifest?.name).toBe('Merel');
  expect(manifest?.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));

  // The service worker keeps everything at the first visit.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).some((k) => k.startsWith('merel-')))).toBe(true);

  await context.setOffline(true);
  for (const path of ['/fr/', '/nl', '/']) {
    await page.goto(path);
    await expect(page.locator('.identity__wordmark')).toBeVisible();
  }
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Start' }).first().click();
  await page.keyboard.press('g');
  await expect(page.locator('.instrument__note')).toHaveText('sol');
  await context.setOffline(false);
});
