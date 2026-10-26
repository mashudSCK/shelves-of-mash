# Shelves of Mash improvement roadmap

Date: 2026-10-26. Status: proposed roadmap, prepared on `main`.

Implementation was subsequently requested on `main`. See [implementation results](improvement-results.md)
for delivered changes, fresh verification, review decisions, and remaining operational work.

## Purpose

Improve security, reliability, and discovery while preserving the archive's reading identity and its Next.js, React, TypeScript, Tailwind, and Supabase architecture. Deliver small, independently verifiable changes. This document does not authorize deployment or database changes.

## Evidence and current state

Fresh local inspection found `main` at `f0efc29` and local branch `001-scalability` at `5164956`. The latter contains unique-view recording, scalable reads, reading tools, a stateful Supabase fixture, monitoring, project skills, and the constitution. These changes are not present in this checkout of `main`. Review that branch before recreating work. Existing untracked `.specify/` content must be preserved.

On current `main`, `lib/data/writings.ts` filters archive tags after pagination and calculates totals before that filtering. Shelf counts and daily selection fetch collections into application code. Writing rendering invokes a view increment. Atlas intentionally loads the latest 30 published writings. The existing browser suite covers public navigation, responsiveness, search, Atlas, and signed-out admin redirects, but does not establish database authorization correctness.

Obsidian sources consulted: root `memory.md`, `Working Agreement.md`, `Projects/The Shelves of Mash.md`, and `UI UX Designs/Six Fundamental UI UX Design Laws.md`. Historical notes report migrations 0006 and 0007 applied to the confirmed hosted database; deployment and environment alignment remained pending. Hosted state has not been freshly verified. No application tests were run for this planning document.

## Recommended sequence

### 1. Reconcile the baseline

Review changes on `001-scalability`, including the later fixture and monitoring commit. Identify completed improvements, regressions, and dependencies before integrating selected work into `main`. Prefer reusing verified existing implementation over rewriting it. Read the constitution from that branch until its integration is settled.

Verify that the intended application environment, Supabase endpoint, keys, and migration history belong together without displaying credentials. Do not apply migrations based only on historical notes. Establish a reproducible fixture-backed baseline and distinguish fixture results from hosted checks.

Acceptance: document the selected commits and integration approach; preserve local files; verify migrations against the intended database before rollout; run fresh type-check, lint, E2E, build, and relevant existing branch regressions on the integrated result.

### 2. Review and strengthen security boundaries

Use `security-threat-model` to map public reading, reader accounts, admin mutations, uploads, cron publishing, and Supabase boundaries. Use `security-best-practices` for the TypeScript and framework review. Use `security-ownership-map` only when ownership analysis adds value beyond the personal-project maintainer model.

Review RLS and Storage policies, function grants and SECURITY DEFINER behavior, role enforcement, private drafts and previews, per-reader bookmarks, OAuth and magic-link redirects, session refresh, Markdown sanitization, upload validation, service-role isolation, cron authorization, logging, and dependencies. Treat these as review targets, not confirmed vulnerabilities. Evaluate CSP against actual application requirements before adopting a policy.

Acceptance: produce an evidence-backed, prioritized report with concrete file references and explicit assumptions. Add focused checks proving anonymous and reader users cannot perform admin operations, access private drafts, or read another reader's private data. Check rejection of unsafe redirects, malicious Markdown, invalid uploads, and unauthorized cron requests. Resolve confirmed high-impact issues before release; record any deferred findings and their rationale.

### 3. Make discovery and counts correct

Reuse prior branch work where it satisfies the requirements. Ensure archive tag filtering occurs before pagination and counting; combine year, shelf, and tag filters correctly. Use stable ordering, validated page inputs, bounded reads, and database aggregates where demonstrated necessary. Preserve the agreed unique-view semantics and historical totals.

Acceptance: matching results and totals across multiple pages and combined filters; predictable invalid-page and empty states; repeated views follow the documented reader/browser identity rules; no unpublished content appears in public results. Exercise a dataset large enough to cross provider limits, without inserting test content into production.

### 4. Improve reading and Atlas usability

Audit current screens before selecting UI changes. Preserve typography, colors, and primary reading content. Evaluate navigation and account access across phone, tablet, and desktop; bookmark and share feedback; long-title and enlarged-text behavior; table-of-contents usability; and Atlas keyboard access and discoverability. Review existing reading tools before adding controls.

Apply the six Obsidian laws: familiar interactions (Jakob), accessible targets (Fitts), meaningful information groups (Miller), manageable choices (Hick), spatial and semantic grouping (Proximity), and system assistance with user control (Tesler). Document context-specific exceptions. Do not impose a fixed seven-item limit or hide primary content to reduce choices.

Acceptance: complete the find-writing, read-writing, bookmark, and account-access journeys with keyboard and touch. Verify labels, visible focus, contrast, text resizing, reduced motion, and feedback. If Atlas remains limited to 30 writings, make that scope understandable and preserve another route to the complete archive. Use the host LAN address and verify bindings for physical-device checks.

### 5. Make publishing and releases dependable

Reuse existing monitoring and fixture work after review. Add a CI gate for relevant checks using isolated data. Verify draft save, preview, scheduling, publication, cover replacement, and failure recovery. Confirm actual scheduler cadence and timezone before promising publication precision. Keep monitoring payloads free of credentials and private writing content.

Acceptance: reproducible checks with no production mutations; authorized scheduling succeeds and unauthorized calls fail; failed saves preserve recoverable input; health reporting distinguishes healthy, degraded, and unavailable states; document migration order, application rollback, and backup/restore verification.

## Scope boundaries and decisions

The recommended approach is reliability and security first, then focused reader improvements. A reader-first approach would expose visible changes sooner but postpone authorization and rollout confidence. A broad redesign adds scope without evidence and is not recommended.

Do not add a replacement backend, search provider, animation library, recommendation engine, comments, subscriptions, or AI generation without a separate demonstrated need. Do not merge the entire existing branch automatically. Each implementation slice needs a bounded scope and observable acceptance criteria; substantial slices should use the existing Spec Kit workflow after its integration is resolved.

Next decision: confirm whether the first implementation slice should reconcile existing branch work or perform the security review against current `main`. No product implementation, branch integration, commit, push, or deployment has been performed by creating this roadmap.
