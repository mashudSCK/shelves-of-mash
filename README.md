# The Shelves of Mash

> Explore the shelves of a wandering mind.

A mobile-first personal archive built with Next.js 16, React 19, TypeScript,
Tailwind CSS, and Supabase.

## Features

- Reader home, shelves, archive, full-text search, bookmarks, and long-form writing pages
- Interactive Atlas connecting published writings to shelves and tags
- Passwordless Supabase authentication with reader and administrator roles
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
```

Migration `0004` creates the public `writing-covers` bucket with a 5 MB limit,
restricts uploads and deletes to administrators, and adds the scheduled-post index.

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

The default Supabase email service is intended only for development and has strict
limits. Before launch:

1. In Supabase, open **Authentication > URL Configuration**.
2. Set the production Site URL and add local/preview callback URLs such as
   `http://localhost:3000/auth/callback`.
3. Open **Authentication > Emails > SMTP Settings** and configure a transactional
   provider such as Amazon SES, Postmark, Resend, or SendGrid.
4. Disable link tracking in the SMTP provider so magic links are not rewritten.
5. Review **Authentication > Rate Limits** after SMTP is enabled.
6. Keep OTP expiry at one hour or less and enable CAPTCHA if sign-in abuse appears.

## Scheduled publishing

`vercel.json` invokes `/api/cron/publish-scheduled` every five minutes. Vercel sends
`CRON_SECRET` as a bearer token when that environment variable is configured.
Scheduled publication runs only on production deployments.

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
