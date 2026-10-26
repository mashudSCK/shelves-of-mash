# Scalable database reads: local evidence

Date: 2026-10-24. Isolated PGlite PostgreSQL/WASM on this Windows host; no production writes or load tests. Run `node tests/scalability-db.mjs <scratch @electric-sql/pglite/dist/index.js>`. No application dependency was added.

The fixture imports the actual initial schema and hardened admin helper, then creates 20,000 writings (15,000 published), ten shelves, and 20,000 bookmarks split between two accounts. Before migration the regression failed with PostgreSQL error 42883, missing `get_shelf_counts`. After migration it passes complete counts/UTC years, deterministic daily selection beyond 1,000 rows, wraparound/negative/null days, dashboard totals and deterministic top five, anonymous execution denial, reader guard denial, published-only aggregates even for admins, private bookmark RLS, and empty states.

Normal EXPLAIN ANALYZE plans (no forced index usage); public chronology explicitly uses published_at DESC NULLS LAST, id DESC to match application queries:

| Query | Selected index | Returned rows | Execution time |
| --- | --- | ---: | ---: |
| Published chronology | idx_writings_published_order | 12 | 0.261 ms |
| Shelf chronology | idx_writings_published_shelf_order | 12 | 0.129 ms |
| Draft update chronology | idx_writings_status_updated_order | 20 | 0.174 ms |
| Bookmark chronology | idx_bookmarks_user_created_order | 20 | 0.127 ms |

Each plan selected an index-only scan, with 12–20 heap fetches before vacuum. Existing reverse tag lookup index remains; no duplicate is added. Plans run as fixture owner to isolate access paths; role/RLS checks run separately as anon/authenticated. Supabase role-specific plans still require integration verification.

Ten warm RPC calls averaged 8.16 ms (shelves), 15.13 ms (years), 18.21 ms (daily offset 14,000), and 33.53 ms (dashboard). Timings include WASM/client overhead and run as fixture owner with an administrator identity. They are observations, not service guarantees. Counts/year aggregation and daily count/offset remain linear; dashboard ranking aggregates all bookmarks.

## Interfaces and rollout

`get_shelf_counts()` returns `(shelf_id uuid, writing_count bigint)` for published writings; callers supply zero for empty shelves. `get_archive_years()` returns descending `(year integer)` from non-null published timestamps in UTC. `get_daily_writing_id(day_number bigint)` returns a UUID ordered by ID, modulo the complete published count; empty/null gives null and negative days wrap.

`get_dashboard_stats()` returns camelCase totals and `mostViewed`/`mostBookmarked` arrays, at most five records each with title, slug, and the snake_case count. Ties sort by UUID. Dashboard totals and bookmark ranking include all statuses. Most-viewed ranking includes published writings only, preserving the existing administrator overview.

Public aggregates are security invoker and explicitly filter published content. Dashboard uses security definer with an empty search path, qualified tables, and `public.is_admin()` before reading. Anonymous execution is revoked; authenticated readers fail the guard. Existing data, policies, and RPCs remain unchanged.

Apply migration before dependent application code. Application rollback leaves additive functions/indexes intact. Conventional transactional index creation may briefly block writes; schedule accordingly for a busy archive. Supabase permissions and plans require post-migration verification. Live integration remains pending: local credentials target a different project from the confirmed database.


## Application fixture observations

Responsive E2E on 2026-10-24: 21/21 passed in 42.8 seconds using Next development mode
and a local PostgREST-shaped fixture with 1,205 writings. A single archive navigation
sample per viewport measured TTFB 303 ms (phone), 588 ms (tablet), and 246 ms (desktop).
These include development overhead, local environment effects, and no real Supabase
network/database latency. They establish exercised application paths, not benchmark capacity.

Application query tests use the real Supabase JS query builder with mocked HTTP and
Next cache boundaries. They verify request construction and isolation, not the hosted
PostgREST planner. SQL/RLS tests run against actual PostgreSQL/WASM. The fixture-backed
production build passes and prerenders Home, Shelves, and Atlas at a120-second interval.
The default local environment still fails prerendering until migration0007 and matching
project credentials are configured. No hosted migration0007 or application deployment was performed.

Sitemap chunks use root `/sitemap.xml?page=N` URLs. Bounded ID-ordered offset batches
cover unchanged datasets; edits during generation can temporarily shift URL membership.

## Hosted migration 0007 — 2026-10-24

Applied the exact local SQL inside a transaction through the authenticated SQL Editor to
confirmed project yibmiujhbdpufcpogeam, at the user's explicit request. Preflight found the
admin guard present and the aggregate RPC absent. Writings and total views were0 before
and after. Postflight verified all four RPC signatures, successful empty-state public reads,
four index names, public execution grants, anonymous dashboard denial/authenticated grant,
and preserved one- and two-argument view RPCs. No content fixture was inserted.

Proof: migration-0007-verification.png in this directory. This is schema/grant and empty-state
verification; role-specific nonempty queries and real production traffic remain unmeasured.
Application deployment and local endpoint/key alignment remain pending. No credentials changed.
