# Publication improvements and release

Approved scope: user's implement-all request2026-10-24 accepts seven recommendations.
Keep existing Next.js/Supabase and reading identity. No new paid service or plan changes.

1. Align local confirmed Supabase endpoint AND keys, centralize actual canonical URL, test and merge
   scalability plus this work into main, push, and verify production deployment.
2. Editorial timestamps change only for content/metadata edits, not view increments.
3. Exercise authenticated draft/preview/cover/schedule/publish/archive flows through real UI/actions
   against isolated local backend; retain role/RLS regressions. No production test content.
4. Single site URL setting feeds metadata, share URLs, robots, sitemap, and canonical URLs.
5. Search rank in Postgres, snippets/highlights safely rendered as text/React (never raw SQL HTML).
6. Private operational events for errors, slow queries and publishing jobs; bounded/redacted reporting.
   Local application archive export/restore validation without overwriting production or claiming
   full account/storage disaster recovery from a partial data backup.
7. Reading progress, optional text size, explicit continue-reading choice; local-only device storage,
   graceful unavailable storage, accessible controls, respect reduced motion, preserve article layout.

Acceptance: focused failing regressions before code; SQL permission/ranking/timestamp tests;
authenticated UI workflows and reading tests phone/tablet/desktop; typecheck/lint/build;
isolated recovery round-trip; independent review; hosted migrations verification; deployment smoke.

Implementation defaults: local reading size18/20/22px; no automatic scroll restoration.
Search uses published-only invoker SQL and weighted existing search_vector; stable rank/date/id order.
Operational events visible only to administrators; no query strings/tokens/content in logs.
Production release is explicitly authorized by item1 and implement-all; paid upgrades are not.
