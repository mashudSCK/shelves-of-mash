import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

const env = { ...process.env, PLAYWRIGHT_FIXTURES: '1', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:4380',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  CRON_SECRET: 'isolated-fixture-cron-secret', NEXT_PUBLIC_SITE_URL: 'http://localhost:3100', MONITORING_WEBHOOK_URL: '' };
const build = process.argv[2] === 'build';
let backend;
try {
  if (build) {
    backend = spawn(process.execPath, ['tests/fixtures/supabase.mjs'], { env, stdio: 'inherit' });
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (backend.exitCode !== null) throw new Error('Isolated backend could not start. Check port 4380.');
      try { ready = (await fetch('http://127.0.0.1:4380/health', { signal: AbortSignal.timeout(500) })).ok; } catch { /* Wait for child readiness. */ }
      if (ready) break;
      await setTimeout(100);
    }
    if (!ready) throw new Error('Isolated backend did not become ready.');
  }
  const command = build ? ['node_modules/next/dist/bin/next', 'build'] : ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(3)];
  const child = spawn(process.execPath, command, { env, stdio: 'inherit' });
  process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
} finally { backend?.kill(); }
