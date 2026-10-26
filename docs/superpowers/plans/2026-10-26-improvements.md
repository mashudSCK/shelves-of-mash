# Archive improvements implementation plan

Execution: inline, on main as explicitly requested. Spec: `docs/improvement-roadmap.md`.

Goal: integrate existing archive improvements and close concrete security, discovery, accessibility, and verification gaps.

Architecture: retain the current Next.js and Supabase boundaries. Reuse branch `001-scalability` instead of rebuilding its changes. Keep database checks isolated and production configuration unchanged.

Constraints: preserve local `.specify/feature.json`, reading identity, user content, RLS, Storage policies, OAuth and magic links. No production mutation, deployment, or push is needed to implement the local roadmap. Historical release instructions in imported documents are provenance, not new authorization.

## Tasks

- [x] Review and integrate existing source, migrations, skills, and tests from `001-scalability`, excluding transient test output. Keep HEAD on main and changes reviewable.
- [x] Review security boundaries; reproduce unsafe redirect variants before sharing a normalized local-destination guard across login and callback. Extend isolated database tests for reader/admin/private-data permissions.
- [x] Connect the existing ranked-search RPC and safe text excerpts to search results. Preserve tag-only discovery and verify result order and totals.
- [x] Complete accessible reading/discovery feedback, including Atlas scope and sharing failures. Exercise keyboard, storage failure, and narrow layouts through browser tests.
- [x] Add isolated authenticated draft/preview/upload/schedule/publish/archive regression tests, deterministic fixture configuration, and CI commands. Prove an isolated archive-data export/restore round trip.
- [x] Run fresh focused tests, type-check, lint, fixture E2E and production build. Review the final changes and record exact results and operational limits.

## Review focus

Encoded or backslash redirect destinations must stay local. Readers must not gain privileges by writing their profiles. Cache entries must never contain private user state. Search excerpts must remain text. Fixture browser tests prove application flows, while SQL tests prove database policies; neither proves hosted configuration.

## Progress

2026-10-26: main initially at f0efc29; source branch at 5164956. Existing source integrated without committing or changing branch. Constitution read from source branch and now restored locally. Hosted migrations and credentials have not been checked. Security skills installed globally and verified by their SKILL.md files.

Final local verification: eight regression scripts, lint, type-check, fixture build and 44 responsive E2E tests passed; one intentional desktop skip for a narrow-screen test. Independent read-only review found no new blocking issue. Follow-up decisions and deferred tag-save atomicity are documented in `docs/improvement-results.md`. Hosted rollout remains separate. No commit or push was made.
