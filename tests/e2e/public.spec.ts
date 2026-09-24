import { expect, test } from '@playwright/test';

test('reader shell is responsive and has no horizontal overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'The Shelves of Mash' })).toBeVisible();

  const viewportWidth = page.viewportSize()!.width;
  const bottomNav = page.getByRole('navigation', { name: 'Primary' }).last();
  if (viewportWidth < 768) {
    await expect(bottomNav).toBeVisible();
  }

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
});

test('search accepts query parameters', async ({ page }) => {
  await page.goto('/search?q=TEST');
  await expect(page.getByRole('searchbox')).toHaveValue('TEST');
  await expect(page.getByText(/result.*for/i)).toBeVisible();
});

test('atlas renders live relationships or a valid empty state', async ({ page }) => {
  await page.goto('/atlas');
  await expect(page.getByRole('heading', { level: 1, name: 'Atlas' })).toBeVisible();
  await expect(page.getByLabel('Relationship map').or(page.getByText(/atlas will appear/i))).toBeVisible();
});

test('protected admin route redirects signed-out visitors', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin|\/login\?next=\/admin/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});
