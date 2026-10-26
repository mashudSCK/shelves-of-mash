# Scaling the Shelves of Mash

Status: approved 2026-10-24; implemented locally, hosted rollout pending.

## Intent and constraints

Support a growing personal archive and public publication while retaining Next.js,
Supabase, the current reading experience, and modest operational complexity. The user
selected optimization of the existing stack. Do not introduce multi-author workflows,
external search, queues, Redis, or hosting upgrades in this phase.

## Approaches

1. **Optimize the existing stack (selected):** bounded database queries, SQL aggregates,
   public-read caching, and matching indexes. Lower operational cost; the database still
   performs aggregates and serves cache misses.
2. **Separate search, cache, and analytics services (deferred):** can isolate workloads at
   higher traffic, but introduces additional services, failure modes, and costs. Revisit
   only after measurements identify a bottleneck the existing stack cannot handle.

## Findings from the current code

- Shelf, tag, admin-writing, and bookmark lists have no application pagination. Supabase
  response limits can silently truncate them as well as increasing transfer/render costs.
- Dashboard totals, shelf counts, archive years, and the daily writing selection download
  raw rows for aggregation. Their correctness depends on response-size limits.
- Archive tag filtering occurs after pagination, producing incomplete pages and wrong totals.
- Public data functions use a cookie-aware client. Route revalidation settings alone do not
  establish shared public-data caching. Proxy authentication runs on every matching request.
- Sitemap generation fetches all writings in one request, risking omitted URLs at scale.
- View migration 0006 now exists in confirmed database `yibmiujhbdpufcpogeam`; local
  environment variables still reference a different project. The confirmed database contains
  zero writings, so realistic volume validation must use isolated synthetic fixtures.

## Proposed implementation

### Bound all growing collections

Reuse existing Pagination controls and URL parameters. Use 12 cards per public page and
20 rows per admin page; these are proposed implementation defaults. Paginate shelves,
text/tag search, admin writings, and private bookmarks. Use stable ordering with an ID
tie-breaker. Validate page inputs and retain existing filters. Apply tag filters in the
database before pagination and counting. Avoid selecting Markdown bodies for list views.

Keep the Atlas's existing 30-writing limit. Batch sitemap reads with stable ordering so
all URLs are included; split sitemap output if the sitemap protocol's URL limit is reached.

### Aggregate in Postgres

Add narrowly scoped RPCs for shelf counts, distinct archive years, daily writing selection,
and dashboard summaries/top bookmark counts. Public RPCs must expose only published data;
admin aggregates must enforce administrator authorization. Preserve RLS and restrict function
execution appropriately. Return aggregates instead of downloading whole tables. Use migration
0007 with a forward path and non-destructive application rollback.

### Cache only public data

Use an anonymous, cookie-free Supabase client for cacheable published-content reads. Cache
bounded public queries with a 120-second normal TTL, with explicit invalidation after writing/shelf
mutations and scheduled publishing. Never cache sessions, roles, drafts, previews, bookmark
state, or private account results in a shared cache. Avoid caching transient database failures
as successful empty content. Preserve dynamic user controls on writing pages.

Skip proxy authentication work only when no Supabase session cookie exists; retain refresh
for signed-in requests and authorization checks for protected routes and mutations.

### Add indexes where queries justify them

Evaluate published chronology, shelf chronology, status/update ordering, tag lookup, and
bookmark ordering. Reuse existing indexes and add only missing composite indexes supported
by query-plan evidence. Preserve full-text search's existing GIN index. This phase does not
promise a traffic capacity without measurements or change the hosting plan.

## Acceptance and verification

- Isolated fixtures exceeding 1,000 writings prove complete counts, years, sitemap coverage,
  and correct pagination without duplicates or omissions for an unchanged dataset.
- Tag filters select and count matching rows before page slicing; malformed pagination
  inputs do not cause unbounded reads or database errors.
- Private fixtures prove readers cannot access admin aggregates, drafts, or other users'
  bookmarks; shared cache results contain no user-specific data.
- Cache reuse and invalidation are exercised; edits, unpublishing, and scheduled publication
  update relevant public results. The 120-second value is a normal cache TTL, not a strict
  maximum age during background revalidation or database outages. Unpublishing must explicitly
  expire affected content rather than relying only on background refresh.
- Record representative query plans and application timings against synthetic volume.
  Report measurements rather than inventing throughput or latency guarantees.
- Run focused regressions, typecheck, lint, build, and responsive E2E checks. Do not load-test
  production or insert synthetic content there.

## Rollout and boundaries

Apply schema expansion before dependent application code. Verify RPC permissions and query
plans, deploy the application only when authorized, and retain old-compatible paths during
rollout. A rollback restores application code while preserving new data and additive indexes.
Do not automatically change Vercel/Supabase subscriptions or rotate credentials.

Align local endpoint and matching keys with the confirmed project before live integration
tests. Do not replace only the endpoint while retaining keys from another project. Current
production application deployment has not been performed as part of migration 0006.

## References

- Next.js caching: https://nextjs.org/docs/app/guides/caching-without-cache-components
- Next.js invalidation: https://nextjs.org/docs/app/api-reference/functions/revalidateTag
- Supabase query optimization: https://supabase.com/docs/guides/database/query-optimization
- Supabase indexes: https://supabase.com/docs/guides/database/postgres/indexes
