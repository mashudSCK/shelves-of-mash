# Research decisions

Approved stack: existing Next.js16 and Supabase; no new runtime dependencies. Use unstable_cache
for cookie-free anonymous reads and revalidateTag('public-content', {expire:0}) after mutations.
Private auth/roles/bookmarks remain request-scoped. See official URLs in spec.md. Public queries
use inner relation aliases for shelf/tag filtering before count/range, keeping displayed tags intact.
SQL invoker aggregates expose only published rows; administrator summary uses a guarded definer.
Sitemaps keep root scope with /sitemap.xml?page=N and 500-row stable ID-ordered batches.
Normal cache TTL120 seconds permits background revalidation; explicit unpublishing expires immediately.
