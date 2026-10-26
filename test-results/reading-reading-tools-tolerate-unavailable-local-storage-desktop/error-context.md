# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reading.spec.ts >> reading tools tolerate unavailable local storage
- Location: tests\e2e\reading.spec.ts:26:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByText('Reading settings', { exact: true })
    - waiting for "http://localhost:3100/writing/writing-1" navigation to finish...
    - navigated to "http://localhost:3100/writing/writing-1"
    - locator resolved to <summary class="cursor-pointer py-3">Reading settings</summary>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [active]:
    - generic [ref=f1e4]:
      - generic [ref=f1e5]:
        - navigation [ref=f1e7]:
          - button [disabled] [ref=f1e8]:
            - img "previous" [ref=f1e9]
          - generic [ref=f1e11]:
            - generic [ref=f1e12]: 1/
            - generic [ref=f1e13]: "2"
          - button [ref=f1e14] [cursor=pointer]:
            - img "next" [ref=f1e15]
        - generic [ref=f1e18]:
          - generic "No Next.js version data was found." [ref=f1e21]: Next.js 16.3.6 (unknown)
          - generic [ref=f1e22]: Turbopack
      - dialog "Console Error" [ref=f1e24]:
        - generic [ref=f1e27]:
          - generic [ref=f1e29]:
            - generic [ref=f1e30]:
              - generic [ref=f1e31]: Console Error
              - generic [ref=f1e33]:
                - button "Copy Error Info" [ref=f1e34] [cursor=pointer]
                - button "No related documentation found" [disabled] [ref=f1e37]
                - button "Attach Node.js inspector" [ref=f1e40] [cursor=pointer]
            - generic [ref=f1e50]:
              - text: Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client. Consider using template tag instead (
              - link "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template" [ref=f1e51] [cursor=pointer]:
                - /url: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
              - text: ).
          - generic [ref=f1e52]:
            - generic [ref=f1e53]:
              - paragraph [ref=f1e55]:
                - generic [ref=f1e60]: components\layout\theme-flash-guard.tsx (14:10) @ ThemeFlashGuard
                - button "Open in editor" [ref=f1e61] [cursor=pointer]
              - generic [ref=f1e65]:
                - generic [ref=f1e66]: "12 | })();"
                - generic [ref=f1e67]: "13 | `;"
                - generic [ref=f1e68]: "> 14 | return <Script id=\"theme-flash-guard\" strategy=\"beforeInteractive\" dangerouslySetInnerHTML={{ __html: code }} />;"
                - generic [ref=f1e69]: "| ^"
                - generic [ref=f1e70]: "15 | }"
                - generic [ref=f1e71]: 16 | import Script from 'next/script';
                - generic [ref=f1e72]: 17 |
            - generic [ref=f1e73]:
              - generic [ref=f1e74]:
                - paragraph [ref=f1e75]:
                  - text: Call Stack
                  - generic [ref=f1e76]: "16"
                - button "Show 13 ignore-listed frame(s)" [ref=f1e77] [cursor=pointer]
              - generic [ref=f1e80]:
                - generic [ref=f1e81]: script
                - text: <anonymous>
              - generic [ref=f1e82]:
                - generic [ref=f1e83]:
                  - text: ThemeFlashGuard
                  - button "Open ThemeFlashGuard in editor" [ref=f1e84] [cursor=pointer]
                - text: components\layout\theme-flash-guard.tsx (14:10)
              - generic [ref=f1e87]:
                - generic [ref=f1e88]:
                  - text: RootLayout
                  - button "Open RootLayout in editor" [ref=f1e89] [cursor=pointer]
                - text: app\layout.tsx (63:9)
      - contentinfo [ref=f1e92]:
        - region "Error feedback" [ref=f1e93]:
          - paragraph [ref=f1e94]:
            - link "Was this helpful?" [ref=f1e95] [cursor=pointer]:
              - /url: https://nextjs.org/telemetry#error-feedback
          - button "Mark as helpful" [ref=f1e96] [cursor=pointer]
          - button "Mark as not helpful" [ref=f1e100] [cursor=pointer]
    - generic [ref=f1e107] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=f1e108]
      - generic [ref=f1e112]:
        - button "Open issues overlay" [ref=f1e113]:
          - generic [ref=f1e114]:
            - generic [aria-hidden] [ref=f1e115]: "1"
            - generic [ref=f1e116]: "2"
          - generic [ref=f1e117]:
            - text: Issue
            - generic [aria-hidden] [ref=f1e118]: s
        - button "Collapse issues badge" [ref=f1e119]
  - generic [ref=f1e123]:
    - heading "This page couldn’t load" [level=1] [ref=f1e126]
    - paragraph [ref=f1e127]: Reload to try again, or go back.
    - generic [ref=f1e128]:
      - button "Reload" [ref=f1e130] [cursor=pointer]
      - button "Back" [ref=f1e131] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test('reading tools remember size and offer explicit article resume', async ({ page }) => {
  4  |   await page.goto('/writing/writing-1');
  5  |   await expect(page.getByRole('progressbar', { name: 'Reading progress' })).toBeVisible();
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
> 31 |   await page.getByText('Reading settings', { exact: true }).click();
     |                                                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
  32 |   await page.getByRole('button', { name: 'Text size 20 pixels' }).click();
  33 |   await expect(page.locator('#writing-content')).toHaveCSS('font-size', '20px');
  34 | });
  35 | 
```