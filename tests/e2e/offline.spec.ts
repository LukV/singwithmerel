import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
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

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.m4a': 'audio/mp4',
  '.txt': 'text/plain',
};

/** A plain static server for a copy of dist/, on a free port, with nothing cached. */
async function serve(dir: string): Promise<{ server: Server; base: string }> {
  const server = createServer((req, res) => {
    let path = join(dir, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
    if (!existsSync(path)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(readFileSync(path));
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  return { server, base: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}

// Its own copy of the build on its own server, so changing the worker touches no other test.
test('an open page moves on to a new release by itself', async ({ page }) => {
  const dir = mkdtempSync(join(tmpdir(), 'merel-release-'));
  cpSync('dist', dir, { recursive: true });
  const { server, base } = await serve(dir);
  try {
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
    server.closeAllConnections();
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
