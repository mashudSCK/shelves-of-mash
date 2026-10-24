# The Shelves of Mash

> Explore the shelves of a wandering mind.

A mobile-first personal archive built with Next.js 16, React 19, TypeScript,
Tailwind CSS, and Supabase.

## Features

- Reader home, shelves, archive, full-text search, bookmarks, and long-form writing pages
- Interactive Atlas connecting published writings to shelves and tags
- Supabase authentication with Google OAuth, email magic links, reader roles, and administrator roles
- Responsive admin workspace for drafts, scheduled posts, publishing, archiving, and shelves
- Supabase Storage cover uploads with type and size validation
- Secure Markdown rendering with GFM tables, task lists, code blocks, and image captions
- Private saved-draft previews, unique slug validation, unsaved-change warnings, and delete confirmations
- Scheduled publication through a protected Vercel Cron route
- Security headers, server error instrumentation, responsive E2E tests, sitemap, and robots.txt

## Local setup

### Requirements

- Node.js 20.9 or newer
- A Supabase project

### Environment

Copy `.env.example` to `.env.local` and provide:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=a-random-secret-at-least-16-characters-long
MONITORING_WEBHOOK_URL=
```

`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and `MONITORING_WEBHOOK_URL` are
server-only. Never prefix them with `NEXT_PUBLIC_`.

### Database migrations

Apply all migrations in order through the Supabase SQL editor or CLI:

```text
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_seed_shelves.sql
supabase/migrations/0003_fix_new_user_profile_trigger.sql
supabase/migrations/0004_production_features.sql
supabase/migrations/0005_harden_oauth_profile_trigger.sql
supabase/migrations/0006_unique_writing_views.sql
```

Migration `0004` creates the public `writing-covers` bucket with a 5 MB limit,
restricts uploads and deletes to administrators, and adds the scheduled-post index.
Migration `0005` makes OAuth profile creation more tolerant so a profile edge case
does not block Google sign-in.

Migration `0006` counts each writing once per signed-in account, or once per
signed-out browser identity stored in localStorage. Recording occurs after the
writing mounts in the browser, so server rendering and link prefetch do not add
views. Database uniqueness prevents repeated or concurrent requests from counting twice.
Clearing browser storage, switching browsers, or reading anonymously and then signing
in can create separate identities; account-based deduplication persists across devices.
Anonymous recording requires browser storage and Web Locks support; without them,
only signed-in views are recorded, avoiding unstable identities and duplicate counts.

Apply `0006` before deploying the updated app. Existing view totals and raw events
are preserved; historical signed-in readers are backfilled into the deduplication
registry. Historical anonymous readers cannot be reconstructed. This prevents new
duplicates rather than correcting inflated historical totals. Older application
versions retain the one-argument RPC, with signed-in deduplication; anonymous views
from those versions are skipped until the updated app is deployed.

Rollback the application first if necessary. Leave migration `0006` installed to
retain deduplication data and compatible RPCs; no destructive down migration is required.

The focused database regression runs with a scratch installation of PGlite:

```powershell
npm.cmd install --prefix "$env:TEMP/shelves-view-regression" --no-save --package-lock=false @electric-sql/pglite
node tests/view-count.mjs "$env:TEMP/shelves-view-regression/node_modules/@electric-sql/pglite/dist/index.js"
node tests/view-tracker.mjs
```

It uses an isolated in-memory PostgreSQL fixture and never connects to production.

### Administrator account

Sign in once through `/login`, then promote that profile in the SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'you@example.com'
);
```

### Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Authentication production setup

Google OAuth avoids Supabase's default email rate limit for most sign-ins. Email
magic links remain available as a fallback, but the default Supabase email service
is intended only for development and has strict limits. Before launch:

1. In Supabase, open **Authentication > URL Configuration**.
2. Set the production Site URL and add local/preview callback URLs such as
   `http://localhost:3000/auth/callback`.
3. In Google Cloud Console, create an OAuth client for a web application.
4. Add your Supabase OAuth callback URL to Google's authorized redirect URIs:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
5. In Supabase, open **Authentication > Sign In / Providers > Google**, enable it,
   and enter the Google client ID and client secret.
6. Open **Authentication > Emails > SMTP Settings** and configure a transactional
   provider such as Amazon SES, Postmark, Resend, or SendGrid.
7. Disable link tracking in the SMTP provider so magic links are not rewritten.
8. Review **Authentication > Rate Limits** after SMTP is enabled.
9. Keep OTP expiry at one hour or less and enable CAPTCHA if sign-in abuse appears.

## Scheduled publishing

`vercel.json` invokes `/api/cron/publish-scheduled` once per day on Vercel Hobby.
Upgrade Vercel and change the cron expression if scheduled posts need to publish
more frequently. Vercel sends `CRON_SECRET` as a bearer token when that environment
variable is configured. Scheduled publication runs only on production deployments.

For local testing:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/publish-scheduled
```

## Tests

Install the Playwright browser once:

```bash
npm run test:e2e:install
```

Then run:

```bash
npm run type-check
npm run lint
npm run test:e2e
npm run build
```

If the Playwright CDN is unavailable but a Chromium browser is already installed,
set `PLAYWRIGHT_EXECUTABLE_PATH` to that browser executable before running the suite.

The E2E suite runs phone, tablet, and desktop projects and checks responsive
navigation, overflow, Search, Atlas, and signed-out admin protection.

## Deployment checklist

1. Import the repository into Vercel and add every `.env.example` variable.
2. Generate a unique `CRON_SECRET` with at least 16 random characters.
3. Apply migrations before deploying application code that depends on them.
4. Configure Supabase production and preview redirect URLs.
5. Configure custom SMTP and send test magic links to non-team addresses.
6. Enable Supabase SSL enforcement, account MFA, and database network restrictions where practical.
7. Enable database backups; use Point-in-Time Recovery when the archive becomes critical.
8. Connect an error provider or private webhook through `MONITORING_WEBHOOK_URL`.
9. Enable Vercel Web Analytics or another privacy-appropriate analytics provider if desired.
10. Run the complete verification commands above before promoting a deployment.

## Architecture

- `lib/data`: server-side Supabase reads
- `lib/actions`: authorized server mutations
- `lib/storage`: validated Storage operations and cleanup
- `lib/markdown.tsx`: sanitized GFM rendering and table-of-contents extraction
- `app/api/cron`: authenticated scheduled publishing
- `instrumentation.ts`: server error logging and optional webhook delivery
- `tests/e2e`: responsive Playwright smoke tests

Supabase Row Level Security remains the authorization boundary. Admin layouts and
server actions also call `requireAdmin()` to fail early and provide a clearer user
experience, while database policies protect the underlying data and Storage objects.

## Scalability

Public collections use 12-item pages; administrator lists use 20-item pages. Stable
ID tie-breakers preserve page ordering for an unchanged archive. Tags and shelves
filter in Postgres before pagination and exact counts. Bookmark pages remain private;
administrator lists omit Markdown bodies.

Apply `supabase/migrations/0007_scalable_reads.sql` before deploying these readers.
It adds complete database aggregates and four query-backed composite indexes. Existing
records and RPCs remain intact. Roll back the application without dropping the additive
migration. Index creation can briefly block writes; schedule the migration appropriately.
Migration 0007 was applied transactionally through SQL Editor to hosted project
`yibmiujhbdpufcpogeam` on 2026-10-24. Functions, indexes, grants, and unchanged totals
were verified. Application deployment remains pending.

Only anonymous published-content reads enter the shared 120-second cache. Writes,
unpublishing, shelf changes, and scheduled publishing explicitly expire the public tag.
Sessions, roles, previews, and bookmarks are not shared. Failed reads throw instead of
caching an empty archive. The normal TTL permits background revalidation; it is not a
strict maximum age during outages.

`/sitemap.xml` indexes root-scoped `/sitemap.xml?page=N` chunks, each at most 50,000
URLs, read in 500-row batches. This avoids provider row-limit truncation. Ordering is
stable for unchanged data; concurrent edits can shift pages until regeneration.

Focused checks:

```powershell
node tests/scalability-app.mjs
node tests/scalability-db.mjs "$env:TEMP/shelves-view-regression/node_modules/@electric-sql/pglite/dist/index.js"
$env:PLAYWRIGHT_FIXTURES='1'
npm.cmd run test:e2e
```

The browser fixture serves 1,205 writings locally and overrides Supabase variables only
for its child app process. It never contacts hosted Supabase. SQL tests use 20,000 writings
and 20,000 bookmarks in an isolated PostgreSQL/WASM database. Measured plans/timings and
remaining linear operations are documented in `docs/performance/scalability-db.md`.
These measurements do not establish a production traffic capacity.

The confirmed hosted project is `yibmiujhbdpufcpogeam`; local `.env.local` currently
references a different project. Align the endpoint and its matching keys together before
live integration or deployment. A build against the old project fails until migration
0007 exists there; do not conceal this by substituting empty data. Synthetic fixture builds
verify compilation and prerendering without changing credentials or production data.
