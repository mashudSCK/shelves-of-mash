# Validation and rollout

Run node tests/scalability-app.mjs; node tests/view-tracker.mjs.
Run node tests/scalability-db.mjs <scratch PGlite module>; node tests/view-count.mjs <same module>.
Run npm.cmd run type-check; npm.cmd run lint.
Use PLAYWRIGHT_FIXTURES=1 npm.cmd run test:e2e for isolated responsive volume tests.
Build using initialized Supabase environment or isolated fixture variables; default local project is stale.
Apply migration0007 before deploying dependent app. No production application deploy is implied.
Keep additive migration for application rollback. Align endpoint and matching keys together first.
