import { spawnSync } from 'node:child_process';

for (const test of ['site','auth-redirect','view-tracker','scalability-app','view-count','scalability-db','publication-db','security-db']) {
  const result = spawnSync(process.execPath, [`tests/${test}.mjs`, 'node_modules/@electric-sql/pglite/dist/index.js'], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
