# Scalability implementation plan

Goal: implement the approved growing archive/public publication design with the existing stack.
Spec: docs/superpowers/specs/2026-10-24-scalability-design.md (approved 2026-10-24).
Architecture: bounded queries, database aggregation, anonymous-only shared data cache, private session reads.
Stack: Next.js 16, Supabase/Postgres, existing React/TypeScript/Tailwind; no runtime dependencies added.
Constitution: all five principles pass; preserve content, roles, reading identity, and current local work.

## Global constraints
- Public page size 12; admin page size 20; cache normal TTL 120 seconds; Atlas limit 30.
- No production fixtures, load tests, subscription changes, or secret exposure.
- Local endpoint/key mismatch prevents live integration; isolated fixtures must cover >1,000 writings.

## Task 1: database aggregates and indexes
Files: migration 0007_scalable_reads.sql, tests/scalability-db.mjs, docs/performance/scalability-db.md.
Interfaces: get_shelf_counts()->[{shelf_id,writing_count}], get_archive_years()->[{year}],
get_daily_writing_id(day_number bigint)->uuid, get_dashboard_stats()->DashboardStats JSON.
Steps: write/run failing volume/permission tests; add invoker public RPCs and guarded admin RPC;
measure EXPLAIN/timing for justified composite indexes; rerun tests.
Expected: complete aggregates above 1,000 records; unpublished rows private; unauthorized admin calls fail.

## Task 2: bounded data access and cache
Files: lib/pagination.ts, lib/supabase/public.ts, lib/data/{public-cache,writings,admin,bookmarks,atlas,sitemap}.ts,
lib/actions/{writings,shelves}.ts, cron route, proxy.ts.
Interfaces: public listing functions return {writings,total}; parsePage(unknown)->safe positive integer;
pageRange(page,pageSize)->{page,pageSize,from,to}; invalidatePublicContent()->void.
Steps: write/run failing query/cache/pagination regressions; implement stable ordered ranges, SQL filters,
RPC aggregate calls, cache only anonymous content, explicit invalidation, and anonymous proxy bypass.
Expected: tag filtering before count/range; no shared private data; errors never cached as empty successes.

## Task 3: paginated pages and complete sitemaps
Files: shelf/archive/search/account/admin pages, app/sitemap.xml/route.ts, app/robots.ts, tests/scalability-app.mjs,
tests/e2e/public.spec.ts. Reuse Pagination component and existing design tokens.
Steps: wire 12/20 page sizes, retain filters, query totals; batch sitemap with stable ID-ordered ranges and split
at 50,000 URLs; test >1,000 URLs plus chunk boundaries; run responsive checks.
Expected: all growing writings/bookmarks reachable with bounded responses; no full Markdown in admin lists.

## Task 4: integration and completion
Run focused old/new regressions, typecheck, lint, build, responsive E2E, then independent final review.
Record metrics and rollout/rollback in README, update task ledger and Obsidian. Do not deploy implicitly.
Expected: fresh checks pass or specific blockers reported. Existing changes remain uncommitted.

## Review focus
- Unauthorized account/role access and RLS interaction under anonymous shared cache.
- Stale unpublished/renamed content across invalidation and metadata routes.
- Invalid/huge/duplicate page inputs and date/tag filters.
- Equal timestamps, provider response limits, empty last pages, and chunked sitemap boundaries.
- Failed cached reads, session refresh, and scheduled publication invalidation.

## Execution record
User said implement after approving design. Native execution with isolated DB subtask under
parallel-agents skill; shared contracts fixed above. Feature branch 001-scalability preserves dirty work.
No worktree created because approval was not requested for one; no commits made to pre-existing changes.
