# Project working agreement

The Shelves of Mash is a personal writing archive with shelves and an interactive Atlas.
Preserve its reading identity and Next.js, React, TypeScript, Tailwind, and Supabase architecture.
Follow `.specify/memory/constitution.md` for project principles.

## Shared memory

Before project work, retrieve relevant Obsidian Memory: root memory.md, Working Agreement,
the Shelves project note, and task-specific decisions. Separate historical reports from fresh
verification. Update canonical notes with substantive outcomes, dates, sources, and unresolved
issues. Preserve user content; never record credentials. State when memory is unavailable.

## Agent skills

Read applicable SKILL.md files before use. Select by task rather than loading every skill.
Global skills remain shared dependencies; do not duplicate them into this repository.

- Use Caveman full for chat until the user requests normal mode. Keep technical precision.
  Persisted documents, comments, and PRs use normal prose. Clarity and required updates take priority.
- Use Ponytail for minimal complete changes and reuse existing code and dependencies.
- Use Lean Build and applicable Superpowers brainstorming/planning for substantial features.
- Use Investigate First and systematic debugging before fixes; Surgical Patch for narrow fixes;
  Safe Refactor for restructuring; Migration for compatibility-sensitive transitions.
- Use Impeccable and Make Interfaces Feel Better for UI work. Read
  `.agents/skills/uncodixfy/SKILL.md` for frontend changes. Preserve established product
  typography, colors, and reading identity unless a redesign is requested. Apply restraint
  without mechanically replacing existing design choices.
- Use Transitions Dev/Polish for relevant motion work. Prefer CSS or existing Framer Motion.
  Use GSAP skills only when a demonstrated requirement warrants GSAP.
- Use Verify and Stop and verification-before-completion for acceptance checks; Caveman Review
  for requested concise reviews. Delegate only when explicitly authorized or required.
- Use installed Spec Kit skills for substantial specification-driven work: `$speckit-specify`,
  `$speckit-plan`, `$speckit-tasks`, `$speckit-implement`, `$speckit-converge`. Use clarify,
  analyze, and checklist when useful. Installation does not itself authorize feature work.
- Game-development and reverse-engineering skills are conditional, not routine web tooling.

## Project safeguards

Preserve Supabase RLS, server guards, Storage policies, reader/admin roles, Google OAuth,
magic-link fallback, safe local post-login destinations, and account access across screen sizes.
Redirect configuration and SMTP delivery are separate concerns; generate fresh links after changes.
Use progressive disclosure for secondary controls without hiding primary reading content.
Do not copy other projects' exact pagination, breakpoints, layouts, or motion timings.
Preserve keyboard access, labels, contrast, feedback, empty states, and reduced motion.
For device tests, use the host LAN address and check network access and bindings.
Inspect Git status and remotes before branch or push operations; preserve local work.
Run checks appropriate to the change: `npm run type-check`, `npm run lint`,
`npm run test:e2e`, `npm run build`. Never reuse historical passing-test claims.

## Setup provenance

Adopted 2026-10-24. Official Spec Kit initialized with Codex skills and PowerShell scripts.
Use `uvx --from specify-cli specify` for CLI maintenance; the standalone specify launcher has
an inaccessible Python runtime. Uncodixfy source: https://github.com/cyxzdev/Uncodixfy.
Project installation: `.agents/skills/uncodixfy`. Do not change machine execution policy;
use process-scoped PowerShell `-ExecutionPolicy Bypass` when necessary.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
