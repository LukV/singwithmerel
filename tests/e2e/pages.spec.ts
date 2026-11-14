import { expect, test } from '@playwright/test';

test('the privacy page, in each language, and back to the lesson', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('link', { name: 'Privacy and about' }).click();
  await expect(page).toHaveURL(/\/en\/privacy\/$/);
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await expect(page).toHaveTitle('Privacy and about: Merel');

  // The language switch stays on the privacy page.
  await page.getByRole('link', { name: 'FR' }).click();
  await expect(page).toHaveURL(/\/fr\/privacy\/$/);
  await expect(page.getByRole('heading', { name: 'Confidentialité' })).toBeVisible();

  await page.getByRole('link', { name: 'Retour à Merel' }).last().click();
  await expect(page).toHaveURL(/\/fr\/$/);
  await expect(page.locator('#c1')).toBeAttached();
});

test.describe('on a phone', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('a tip under Start: headphones', async ({ page }) => {
    await page.goto('/nl/');
    await expect(page.locator('.tips')).toContainText('oortjes');
    // Nothing is wider than the phone.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
});

test('the invitation to install comes after the first completed level, on an iPhone', async ({ browser }) => {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('/en/');
  await expect(page.locator('.tips')).toContainText('silent switch');
  await expect(page.locator('.invite')).toHaveCount(0);

  await page.evaluate(() => localStorage.setItem('merel.v1', JSON.stringify({ version: 1, lang: 'en', levels: { 1: { dots: 5, done: true } }, skipped: [] })));
  await page.reload();
  const invite = page.locator('.invite');
  await expect(invite).toContainText('Add to Home Screen');
  // It sits just before the level that is now open.
  await expect(page.locator('.invite + #c2')).toHaveCount(1);
  await invite.getByRole('button', { name: 'Not now' }).click();
  await expect(invite).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.invite')).toHaveCount(0);
  await context.close();
});
