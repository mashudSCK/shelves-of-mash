# SDD ledger — plan: docs/superpowers/plans/2026-10-24-scalability.md
Pre-flight: Task 1 produces aggregate RPCs consumed by Task 2; contracts agreed exactly.
Pre-flight: Task 2 produces paginated {writings,total} APIs consumed by Task 3; pages updated atomically.
Baseline: previous view regressions and typecheck/build pass from prior session; rerun focused tests now.
Execution: user authorized implementation. Current dirty checkout preserved on branch 001-scalability.
Task 1: complete — DB regression RED missing RPC; GREEN20k fixture, RLS/guards, complete counts.
Task 2: complete — application regression RED missing pagination; GREEN query/cache/privacy coverage.
Task 3: complete — sitemap regression RED missing batching; GREEN1205 and50000 boundary;21 E2E pass.
Final review: fixed root sitemap scope — failing advertised-child URL regression then root query chunks.
Final review: fixed index null ordering and published-only dashboard ranking — DB RED/GREEN evidence.
Ruling: sitemap uses bounded500-row ID-ordered offsets, not an ID cursor; deterministic for unchanged data.
Reason: split chunks can jump to ordinal boundaries without scanning all previous URLs. Concurrent writes
may shift sitemap membership; regenerating manifests/chunks covers eventual discovery (not a snapshot).
Final gates in progress; migration0007 not applied to production. Local environment remains unmodified.
Task 4: complete — typecheck, lint, fixture-backed production build, old view regressions,
application query/cache/session regressions,20k PostgreSQL fixture, and21/21 responsive E2E pass.
Final review issue fixed RED?GREEN: root-scoped sitemap chunk URLs. No remaining review findings.
Hosted rollout pending: migration0007 not applied; local endpoint/keys not aligned; app not deployed.
Hosted migration0007 applied transactionally2026-10-24 to yibmiujhbdpufcpogeam at explicit request.
Verified4 RPCs,4 indexes, execution grants, public empty reads, previous RPC preservation, totals0?0.
Proof: docs/performance/migration-0007-verification.png. App deployment/local credential alignment pending.
