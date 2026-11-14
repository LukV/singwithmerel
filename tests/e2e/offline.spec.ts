import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

// Its own copy of the build on its own port, so changing the worker touches no other test.
test('an open page moves on to a new release by itself', async ({ page }, info) => {
  const port = 4180 + info.parallelIndex;
  const dir = mkdtempSync(join(tmpdir(), 'merel-release-'));
  cpSync('dist', dir, { recursive: true });
  const server = spawn('npx', ['vite', 'preview', '--outDir', dir, '--port', String(port), '--strictPort'], { stdio: 'ignore' });
  try {
    const base = `http://localhost:${port}`;
    await expect.poll(async () => (await fetch(`${base}/en/`).catch(() => null))?.ok ?? false, { timeout: 15_000 }).toBe(true);
    await page.goto(`${base}/en/`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    // A second visit, as an installed app opened before; then it stays open.
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await page.evaluate(() => ((window as unknown as { before: boolean }).before = true));

    // A new release: the same worker with another version.
    const sw = join(dir, 'sw.js');
    writeFileSync(sw, readFileSync(sw, 'utf8').replace(/const VERSION = '(\w+)'/, "const VERSION = '$1-next'"));
    const reloaded = page.waitForEvent('load');
    // What the app does when it comes back into view.
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
    await reloaded;
    expect(await page.evaluate(() => (window as unknown as { before?: boolean }).before)).toBeUndefined();
    await expect
      .poll(() => page.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('merel-'))))
      .toEqual([expect.stringMatching(/-next$/)]);
  } finally {
    server.kill();
    rmSync(dir, { recursive: true, force: true });
  }
});
