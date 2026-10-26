import { expect, test, type BrowserContext } from '@playwright/test';

test.skip(process.env.PLAYWRIGHT_FIXTURES !== '1', 'Isolated authenticated fixture only');
const backend = 'http://127.0.0.1:4380';
test.afterEach(async ({ request }) => { await request.post(`${backend}/__fixture/reset`); });
async function signIn(context: BrowserContext, role: 'reader' | 'admin') {
  const id = role === 'admin' ? '20000000-0000-4000-8000-000000000002' : '20000000-0000-4000-8000-000000000001';
  const payload = { sub: id, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now()/1000)+3600, fixture_role: role };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.fixture`;
  const session = { access_token: token, refresh_token: 'fixture', expires_at: payload.exp, expires_in: 3600, token_type: 'bearer', user: { id, role: 'authenticated', aud: 'authenticated' } };
  await context.addCookies([{ name: 'sb-127-auth-token', value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`, url: 'http://localhost:3100', sameSite: 'Lax' }]);
}

test('reader cannot open admin editor or health history', async ({ page, context }) => {
  await signIn(context, 'reader');
  await page.goto('/admin/writings/new');
  await expect(page).toHaveURL(/\/account\?error=admin_required/);
  await page.goto('/admin/health');
  await expect(page).toHaveURL(/\/account\?error=admin_required/);
});

test('admin draft, private preview, upload validation, scheduling, publishing and archive', async ({ page, context, request }) => {
  test.setTimeout(90_000);
  await request.post(`${backend}/__fixture/reset`);
  await signIn(context, 'admin');
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/admin/writings/new');
  await page.getByLabel('Title', { exact: true }).fill('Workflow publication');
  await page.getByLabel('URL slug').fill('workflow-publication');
  await page.getByLabel('Shelf', { exact: true }).selectOption('40000000-0000-4000-8000-000000000001');
  await page.getByLabel('Content (Markdown)').fill('## Private chapter\n\n<script>window.privateInjected=true</script>\n\n[Unsafe](javascript:alert(1))\n\nA private draft.');
  await page.getByRole('button', { name: 'Save writing' }).click();
  await expect(page).toHaveURL(/saved=created/);
  let state = await (await request.get(`${backend}/__fixture/state`)).json();
  const id = state.writings[0].id;
  expect(state.writings[0].status).toBe('draft');
  const publicDraft = await request.get('/writing/workflow-publication');
  // Next.js can stream a not-found boundary with HTTP 200; verify content isolation.
  expect(await publicDraft.text()).toContain('This shelf is empty');
  await page.goto(`/admin/writings/${id}/preview`);
  await expect(page.getByText('Private preview', { exact: true })).toBeVisible();
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  expect(await page.evaluate(() => 'privateInjected' in window)).toBe(false);
  await page.goto(`/admin/writings/${id}/edit`);
  await page.locator('#cover_image').setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
  await page.getByRole('button', { name: 'Save writing' }).click();
  await expect(page.getByText('Cover images must be JPEG, PNG, WebP, or AVIF.')).toBeVisible();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Workflow publication');
  await page.locator('#cover_image').setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=', 'base64') });
  await page.getByLabel('Status', { exact: true }).selectOption('scheduled');
  await page.getByLabel('Publish date and time').fill('2099-01-01T12:00');
  await page.getByRole('button', { name: 'Save writing' }).click();
  await expect(page).toHaveURL(/saved=updated/);
  state = await (await request.get(`${backend}/__fixture/state`)).json();
  expect(state.writings[0].status).toBe('scheduled');
  expect(state.uploads.length).toBeGreaterThan(0);
  expect((await request.get('/api/cron/publish-scheduled')).status()).toBe(401);
  const headers = { authorization: 'Bearer isolated-fixture-cron-secret' };
  expect((await (await request.get('/api/cron/publish-scheduled', { headers })).json()).published).toBe(0);
  await request.post(`${backend}/__fixture/due`);
  await request.post(`${backend}/__fixture/fail-cron`);
  expect((await request.get('/api/cron/publish-scheduled', { headers })).status()).toBe(500);
  expect((await (await request.get('/api/cron/publish-scheduled', { headers })).json()).published).toBe(1);
  await page.goto('/writing/workflow-publication');
  await expect(page.getByRole('heading', { name: 'Workflow publication', exact: true })).toBeVisible();
  await page.goto('/admin/writings');
  const row = page.getByRole('listitem').filter({ has: page.getByRole('link', { name: 'Workflow publication', exact: true }) });
  await request.post(`${backend}/__fixture/fail-archive`);
  await row.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'could not be archived' })).toBeVisible();
  expect((await (await request.get(`${backend}/__fixture/state`)).json()).writings[0].status).toBe('published');
  await row.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect.poll(async () => (await (await request.get(`${backend}/__fixture/state`)).json()).writings[0].status).toBe('archived');
  expect(await (await request.get('/writing/workflow-publication')).text()).toContain('This shelf is empty');
  await page.goto('/admin/health');
  await expect(page.getByText('publish_scheduled — Failed', { exact: true })).toBeVisible();
  await expect(page.getByText('publish_scheduled — Succeeded', { exact: true }).first()).toBeVisible();
  await request.post(`${backend}/__fixture/reset`);
});
