# Improvement implementation results

Date: 2026-10-26. Work is in the `main` working tree, based on `f0efc29`; no commit, push, or deployment was performed.

## Delivered locally

- Integrated existing source and workflow work from local `001-scalability` at `5164956`, preserving the user's untracked `.specify/feature.json`. Reused unique-view tracking, bounded reads, pagination, public-cache invalidation, and complete sitemap generation.
- Connected the published-only ranked-search RPC and plain-text excerpts. Search input has an accessible name. Added migration 0008's editorial timestamp behavior and migration 0009's private operational events from the existing branch.
- Added shared local authentication destination validation, including encoded controls, backslashes, and normalized double-slash paths. Hardened canonical path handling and marked the privileged Supabase client server-only.
- Updated Next.js and its ESLint configuration to the patched 16.4.3 line. Kept the existing Tailwind major version.
- Preserved the reading typography and palette. Added Atlas scope context, full-archive access, a keyboard/touch connection list and selected-state feedback; explicit sharing recovery messages; optional reading size and resume controls; storage-safe theme behavior; and collapsed long table-of-contents navigation on phone/tablet.
- Added visible archive/restore failure messages and an archive-failure browser regression. Successful publication and failed/retried cron flows are exercised against isolated fixtures.
- Added redacted public-read error and slow-query events, bounded monitoring delivery, and administrator-only event history.
- Added reproducible PostgreSQL authorization/restore tests, authenticated application workflow tests, fixture build/browser commands, and GitHub Actions checks. PGlite is a development dependency only.
- Recorded the user-confirmed security model in `docs/security/shelves-of-mash-threat-model.md`. Added the six Obsidian UI/UX laws and security-skill selection to `AGENTS.md`.

## Verification record

Fresh final checks: `npm run test:regression` passed all eight scripts; `npm run lint` and `npm run type-check` passed. `npm run test:e2e:fixtures` passed 44 tests in 1.8 minutes, with one intentional desktop skip for the narrow-screen-only contents test. The suite covers all three viewport projects. The earlier interrupted run timed out while the computer was suspended and has been superseded by this successful fresh run. `npm run build:fixtures` passed with Next.js 16.4.3, including compilation, TypeScript, and all 17 static pages. Type-check also passed again after that final build. `git diff --check` passed. Phone and desktop reading screenshots were visually inspected after the contents change.

The SQL suite exercises real PostgreSQL policies/functions with 20,000 writings and 20,000 bookmarks for scalability; a separate publication fixture contains 1,205 ranked results. Security tests reject reader role changes, protect private drafts and bookmarks, enforce admin-only Storage writes and operational-event visibility, and round-trip archive tables into a second isolated database.

The browser suite exercises phone, tablet and desktop viewports with synthetic accounts: draft save, private preview, unsafe Markdown links/scripts, invalid cover rejection, valid upload, scheduling, unauthorized cron calls, publishing failure/retry, archive failure/retry, reading preferences, unavailable storage, search text safety, and Atlas keyboard access. Browser fixtures do not prove hosted RLS; SQL tests provide that isolated policy proof.

## Review decisions and remaining limits

An independent read-only reviewer found no new blocking correctness/security regression in the reviewed implementation. The following considered behaviors were resolved explicitly:

1. Archive/restore actions ignored database errors in the original code. They now show recoverable failure messages. A failing archive regression was reproduced before the fix. Tag writes still use separate requests and can fail independently of writing metadata; a transactional tag-save change is deferred and must not be represented as solved. Cost: tag edits can be incomplete during backend failure.
2. Destination normalization could produce a leading double slash from a dot-segment path. Current callers already concatenated the origin, but the helper was strengthened and the new regression failed before the fix. Cost of leaving the old helper contract would have been unsafe reuse by a future caller.
3. A duplicate fixture-only image configuration entry was removed. Fixture image optimization remains disabled only under the explicit test environment.
4. Anonymous view counting intentionally skips unsupported/blocked browser identity storage or locks. This avoids duplicate anonymous counts; it can undercount readers and does not establish unique people.
5. Hosted configuration, applied migration history, real SMTP/OAuth delivery, provider abuse controls, physical-device LAN access and full provider disaster recovery were not verified. Fixture results cannot substitute for those checks.

The dependency audit after compatible updates reports four moderate advisories in the Tailwind/PostCSS selector-parser build chain, with no high/critical advisories in that audit. The automated suggested resolution requires a Tailwind major upgrade. That compatibility migration was not performed. Product inputs do not include arbitrary CSS; retain that boundary and review the build-tool update separately.

The restore test covers shelves, tags, writings and writing-tag relations, not Auth users, Storage bytes, or every private reader table. Monitoring needs a production retention policy. A compatible CSP requires review of actual scripts, fonts and hosting behavior rather than blindly disabling existing functionality.

## Rollout requirements

Verify the intended Supabase endpoint and matching keys together, and inspect the actual migration history. Apply any missing migrations in order through 0009 before deploying dependent code. Historical memory reports 0006/0007 applied; no hosted state was freshly checked here. Keep `PLAYWRIGHT_FIXTURES` unset in production and configure the real `NEXT_PUBLIC_SITE_URL`.

Run the standard live-environment checks after configuration alignment. Verify fresh OAuth/magic links, scheduling cadence/timezone, deployed security headers, private-data access and backup recovery separately. Roll back application code without dropping the additive schema or historical view records. No hosted migration, provider setting, secret, or production content was changed by this implementation.
