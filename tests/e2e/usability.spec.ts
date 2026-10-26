import { expect, test } from '@playwright/test';

test.skip(process.env.PLAYWRIGHT_FIXTURES !== '1', 'Requires isolated content');

test('Atlas explains scope and keeps keyboard selection visible', async ({ page }) => {
  await page.goto('/atlas');
  await expect(page.getByText(/latest 30 published writings/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse the complete archive' })).toHaveAttribute('href', '/archive');
  const node = page.locator('svg g[role="button"][aria-label^="shelf:"]').first();
  await node.focus();
  await node.press('Space');
  await expect(node).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: /Open shelf/ })).toBeVisible();
});

test('sharing failures provide a usable recovery message', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Blocked'); } }, configurable: true });
  });
  await page.goto('/writing/writing-1');
  await page.getByRole('button', { name: 'Share this writing' }).click();
  await expect(page.getByRole('status')).toContainText('Copy the page address');
});

test('ranked search renders excerpts as text and has a named search field', async ({ page }) => {
  await page.goto('/search?q=TEST');
  await expect(page.getByRole('searchbox', { name: 'Search writings' })).toHaveValue('TEST');
  await expect(page.getByText('<script>fixture excerpt</script>').first()).toBeVisible();
  expect(await page.evaluate(() => 'fixtureExcerptExecuted' in window)).toBe(false);
});
