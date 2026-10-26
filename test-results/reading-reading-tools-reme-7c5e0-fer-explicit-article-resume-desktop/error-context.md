# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reading.spec.ts >> reading tools remember size and offer explicit article resume
- Location: tests\e2e\reading.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('progressbar', { name: 'Reading progress' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('progressbar', { name: 'Reading progress' }) with timeout 15000ms
  - waiting for getByRole('progressbar', { name: 'Reading progress' })

```

```yaml
- link "Skip to content":
  - /url: "#main-content"
- banner:
  - link "The Shelves of Mash":
    - /url: /
  - navigation "Primary":
    - list:
      - listitem:
        - link "Shelves":
          - /url: /shelves
      - listitem:
        - link "Archive":
          - /url: /archive
      - listitem:
        - link "Atlas":
          - /url: /atlas
      - listitem:
        - link "Search":
          - /url: /search
      - listitem:
        - link "About":
          - /url: /about
  - link "Account":
    - /url: /account
  - button "Switch to dark mode"
- main:
  - article:
    - link "Philosophy":
      - /url: /shelves/philosophy
    - heading "TEST Writing 1" [level=1]
    - paragraph: An archive fixture.
    - text: January 1, 2026 2 min read
    - button "Add bookmark":
      - img
    - button "Share this writing":
      - img
    - link "Common":
      - /url: /search?tag=common
    - heading "Opening" [level=1]
    - paragraph: A fixture for reading.
    - heading "More thoughts" [level=2]
    - paragraph: More content.
    - heading "Related Writings" [level=2]
    - paragraph: More from Philosophy
    - link "Philosophy TEST Writing 1205 An archive fixture. January 1, 2026 2 min read":
      - /url: /writing/writing-1205
      - text: Philosophy
      - heading "TEST Writing 1205" [level=3]
      - paragraph: An archive fixture.
      - text: January 1, 2026 2 min read
    - link "Philosophy TEST Writing 1204 An archive fixture. January 1, 2026 2 min read":
      - /url: /writing/writing-1204
      - text: Philosophy
      - heading "TEST Writing 1204" [level=3]
      - paragraph: An archive fixture.
      - text: January 1, 2026 2 min read
    - link "Philosophy TEST Writing 1203 An archive fixture. January 1, 2026 2 min read":
      - /url: /writing/writing-1203
      - text: Philosophy
      - heading "TEST Writing 1203" [level=3]
      - paragraph: An archive fixture.
      - text: January 1, 2026 2 min read
- alert
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test('reading tools remember size and offer explicit article resume', async ({ page }) => {
  4  |   await page.goto('/writing/writing-1');
> 5  |   await expect(page.getByRole('progressbar', { name: 'Reading progress' })).toBeVisible();
     |                                                                             ^ Error: expect(locator).toBeVisible() failed
  6  |   await page.getByText('Reading settings', { exact: true }).click();
  7  |   await page.getByRole('button', { name: 'Text size 22 pixels' }).click();
  8  |   await expect(page.locator('#writing-content')).toHaveCSS('font-size', '22px');
  9  |   await page.locator('#writing-content').evaluate((element) => {
  10 |     window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top + element.clientHeight * 0.4);
  11 |   });
  12 |   await expect.poll(() => page.evaluate(() => localStorage.getItem('shelves-reading-progress'))).toContain('writing-1');
  13 |   await page.reload();
  14 |   await expect(page.getByRole('button', { name: /Continue reading/ })).toBeVisible();
  15 |   expect(await page.evaluate(() => window.scrollY)).toBeLessThan(100);
  16 |   await expect(page.locator('#writing-content')).toHaveCSS('font-size', '22px');
  17 |   await page.getByRole('button', { name: /Continue reading/ }).click();
  18 |   await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  19 |   await page.locator('#writing-content').evaluate((element) => {
  20 |     window.scrollTo(0, window.scrollY + element.getBoundingClientRect().bottom - window.innerHeight + 10);
  21 |   });
  22 |   await expect(page.getByRole('progressbar', { name: 'Reading progress' })).toHaveAttribute('aria-valuenow', '100');
  23 |   await expect.poll(() => page.evaluate(() => localStorage.getItem('shelves-reading-progress'))).not.toContain('writing-1');
  24 | });
  25 | 
  26 | test('reading tools tolerate unavailable local storage', async ({ page }) => {
  27 |   await page.addInitScript(() => {
  28 |     Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
  29 |   });
  30 |   await page.goto('/writing/writing-1');
  31 |   await page.getByText('Reading settings', { exact: true }).click();
  32 |   await page.getByRole('button', { name: 'Text size 20 pixels' }).click();
  33 |   await expect(page.locator('#writing-content')).toHaveCSS('font-size', '20px');
  34 | });
  35 | 
```