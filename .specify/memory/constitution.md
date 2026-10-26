<!--
Sync Impact Report
Version: unratified scaffold -> 1.0.0 (initial adoption).
Modified principles: replaced all five scaffold placeholders with project principles.
Added: Architecture and Design Constraints; Development Workflow; Governance.
Removed: scaffold examples. Follow-up TODOs: none.
Dependent templates remain unchanged and read this constitution at runtime.
-->
# The Shelves of Mash Constitution

## Core Principles

### I. Preserve the Writing Archive
Changes MUST serve reading, writing, shelves, or Atlas discovery. Preserve user content
and established product identity. Scope changes to the requested outcome.

### II. Preserve Authorization and Data Integrity
Supabase RLS and Storage policies MUST remain authorization boundaries. Server mutations
MUST enforce roles. Never expose secrets. Data and schema transitions MUST consider
compatibility, preservation, and rollback.

### III. Build the Smallest Complete Change
Reuse existing code, native features, and installed dependencies. Diagnose failures before
editing. Fix the responsible layer, preserve surrounding behavior, and avoid speculative scope.

### IV. Keep Reading and Controls Accessible
UI changes MUST preserve responsive reading, keyboard access, labels, contrast, feedback,
and reduced motion. Use restrained decoration and real icons. Progressive disclosure MAY
simplify secondary details but MUST preserve primary reading content access.

### V. Use Evidence and Shared Memory
Consult relevant Obsidian Memory before dependent decisions. Separate historical reports,
proposals, and current facts. Capture substantive outcomes without credentials. Completion
claims MUST rely on fresh checks appropriate to the changed behavior.

## Architecture and Design Constraints
Retain Next.js, React, TypeScript, Tailwind, and Supabase unless an authorized transition
requires otherwise. Preserve Google OAuth, magic links, safe post-login destinations,
reader/admin roles, bookmarks, and account access across screen sizes. Diagnose redirects
separately from SMTP. Current cron configuration governs publishing; historical provider
limits and cadence require revalidation.

Apply Uncodixfy with the existing design system and reading identity. Prefer CSS or existing
Framer Motion before GSAP. Other projects' numeric settings and layouts are not requirements.

## Development Workflow
Follow AGENTS.md for task-specific skills. Caveman governs chat brevity; persisted artifacts
use normal prose. Use Spec Kit for substantial feature specifications, plans, tasks,
implementation, and convergence. Keep small fixes narrowly scoped.

Changes MUST receive appropriate verification: regression checks for behavior, responsive
checks for UI, and relevant type, lint, build, and E2E checks. Report limitations explicitly.
Documentation-only setup does not require application tests. Preserve local work and inspect
Git destinations before publishing changes.

## Governance
This constitution governs project work subject to higher-priority instructions and explicit
user direction. Amendments MUST record rationale, date, and semantic version changes: major
for incompatible principles, minor for added guidance, patch for clarification. Reviews MUST
check relevant principles and document justified exceptions. Initial ratification records the
user's approval of memory and agent-skill guidance on 2026-10-24.

**Version**: 1.0.0 | **Ratified**: 2026-10-24 | **Last Amended**: 2026-10-24
