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

test('shelf pagination preserves total and page size', async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_FIXTURES !== '1', 'Requires isolated volume fixture');
  await page.goto('/shelves/philosophy');
  await expect(page.getByText('1205 writings', { exact: true })).toBeVisible();
  const cards = page.locator('h3');
  await expect(cards).toHaveCount(12);
  const firstTitle = await cards.first().innerText();
  await page.getByRole('link', { name: 'Next page' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(cards).toHaveCount(12);
  await expect(cards.first()).not.toHaveText(firstTitle);
  await expect(page.getByRole('link', { name: 'Previous page' })).toBeVisible();
});

test('archive applies tag filter before counting and paginating', async ({ page }, testInfo) => {
  test.skip(process.env.PLAYWRIGHT_FIXTURES !== '1', 'Requires isolated volume fixture');
  await page.goto('/archive?tag=rare');
  const timing = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming; return { ttfb: n.responseStart - n.requestStart, duration: n.duration }; });
  console.log(`${testInfo.project.name} archive fixture navigation: ${JSON.stringify(timing)}`);
  await expect(page.getByText('Page 1 of 51', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Next page' }).click();
  await expect(page).toHaveURL(/tag=rare.*page=2/);
  await expect(page.getByText('Page 2 of 51', { exact: true })).toBeVisible();
});

test('sitemap exposes writings beyond provider row limit', async ({ request }) => {
  test.skip(process.env.PLAYWRIGHT_FIXTURES !== '1', 'Requires isolated volume fixture');
  const index = await request.get('/sitemap.xml');
  expect(await index.text()).toContain('/sitemap.xml?page=0');
  const chunk = await request.get('/sitemap.xml?page=0');
  const xml = await chunk.text();
  expect((xml.match(/<url>/g) ?? []).length).toBe(1210);
  expect(xml).toContain('/writing/writing-1205');
});
