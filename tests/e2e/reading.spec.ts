import { expect, test } from '@playwright/test';

test('reading tools remember size and offer explicit article resume', async ({ page }, testInfo) => {
  await page.goto('/writing/writing-1');
  await expect(page.getByRole('progressbar', { name: 'Reading progress' })).toBeVisible();
  await page.getByText('Reading settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Text size 22 pixels' }).click();
  await expect(page.locator('#writing-content')).toHaveCSS('font-size', '22px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  await page.screenshot({ path: testInfo.outputPath('reading-settings.png') });
  await page.locator('#writing-content').evaluate((element) => {
    window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top + element.clientHeight * 0.4);
  });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('shelves-reading-progress'))).toContain('writing-1');
  await page.reload();
  await expect(page.getByRole('button', { name: /Continue reading/ })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(100);
  await expect(page.locator('#writing-content')).toHaveCSS('font-size', '22px');
  await page.getByRole('button', { name: /Continue reading/ }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await page.locator('#writing-content').evaluate((element) => {
    window.scrollTo(0, window.scrollY + element.getBoundingClientRect().bottom - window.innerHeight + 10);
  });
  await expect(page.getByRole('progressbar', { name: 'Reading progress' })).toHaveAttribute('aria-valuenow', '100');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('shelves-reading-progress'))).not.toContain('writing-1');
});

test('reading tools tolerate unavailable local storage', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
  });
  await page.goto('/writing/writing-1');
  await page.getByText('Reading settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Text size 20 pixels' }).click();
  await expect(page.locator('#writing-content')).toHaveCSS('font-size', '20px');
});
