import { defineConfig, devices } from '@playwright/test';

const fixtures = process.env.PLAYWRIGHT_FIXTURES === '1';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? (fixtures ? 'http://localhost:3100' : 'http://localhost:3000');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: !fixtures && Boolean(process.env.CI),
  workers: fixtures ? 1 : process.env.CI ? 4 : 1,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : undefined,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    { name: 'tablet', use: { ...devices['iPad (gen 7)'], browserName: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], browserName: 'chromium' } },
  ],
  webServer: [...(fixtures ? [{
    command: 'node tests/fixtures/supabase.mjs',
    url: 'http://127.0.0.1:4380/health',
    reuseExistingServer: false,
  }] : []), {
    command: fixtures ? 'node node_modules/next/dist/bin/next dev --port 3100' : 'node node_modules/next/dist/bin/next dev',
    url: baseURL,
    reuseExistingServer: !fixtures && !process.env.CI,
    ...(fixtures ? { env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:4380',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      CRON_SECRET: 'isolated-fixture-cron-secret',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3100',
      MONITORING_WEBHOOK_URL: '',
    } } : {}),
    timeout: 120_000,
  }],
});
