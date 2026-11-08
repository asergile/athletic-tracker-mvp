# CLAUDE.md — PBGB

**Last reviewed:** 2026-11-08

Read this first in every session.

## What this is

PBGB (Personal Best Goal Buddy) is a voice-powered performance journal for athletes, live at pbgb.ai. It's a solo project: Alain is the product owner and only developer.

Stack and coding standards: `project-docs/technical-specifications.md`.

## Source of truth, in order

1. **Live systems:** the code on `staging`, git history, Supabase and Vercel. Check these before trusting any doc.
2. **`PROJECT_STATUS.md`:** current phase, work in flight, open decisions.
3. **Internal notes outside this repo:** decision log and infrastructure status (see "Docs" below).
4. **Specs and feature plans:** the PBGB Claude Project. PRDs are Claude Docs; feature plans, phase history and design decisions are Project docs in `claude/` (for example `claude/activity-grid-implementation-plan.md` and `claude/activity-grid-decisions.md`).

Anything in `archive/` is history, not current state.

## Working rules

- Propose before changing code or files, and wait for explicit approval. Bug reports and screenshots are for discussion, not automatic fixes.
- Alain runs all git operations. Propose commit messages; never commit or push.
- `staging` is the deploy branch. Vercel builds every push to `staging`. Promotion to production is a manual step in the Vercel dashboard. `main` is stale.
- Database changes follow the migrations workflow in the tech spec: draft, approve, apply, then move into `supabase/migrations/` with a rollback.
- "Let's put a pin in that" means: add the item to `project-docs/pinned-items.md` (date, issue, cause, proposed fix, files) and carry on with the current task.

## Gotchas

- Treat every migration as a production change: additive first, applied by hand by Alain in the Supabase SQL Editor before pushing code that reads it. Never apply a migration from a session.
- Calendar dates are `'YYYY-MM-DD'` strings from `getLocalDateString()`, compared as strings. Never derive a calendar date from `toISOString()`.
- Next and Vitest resolve `.js` before `.ts`: `src/lib/supabase.js` is the file that runs, not `supabase.ts`. Don't add a `.js` file next to a `.ts` one.
- Checks before a commit: `npm test` and `npm run type-check`. `npm run lint` isn't set up yet.
- If a failure state is known (an error with nowhere to show, a stuck spinner, a double tap), handle it before it ships instead of noting it.
- Workouts load capped at the newest 500. Anything that spans a long period says when its numbers may be incomplete.
- Commands for Alain: zsh, no inline `#` comments in command blocks, always start with `cd ~/Projects/athletic-tracker-mvp`. Add files to commits by name.
- On Android, test staging with the deployment URL from the Vercel dashboard, not the git-staging alias.

## Docs: public vs internal

This repo may go public. Never put these in git-tracked files:

- Cloud project, team or account IDs
- User counts, row counts or other usage numbers
- Security vulnerability details
- Secrets or `.env` values
- Local absolute paths
- Unreleased roadmap or pricing specifics

Those go in `~/Projects/_internal-docs/athletic-tracker-mvp/`, which sits outside any repo:

- `decisions.md`: dated decision log
- `infrastructure-status.md`: IDs, deployment map, security and infra state

Don't use gitignored folders inside the repo for internal notes.

## Keeping docs current

- Part of finishing any phase or commit series: update `PROJECT_STATUS.md` (and this file if a rule changed) in the last commit, and update the Project docs.
- Add a line to `decisions.md` whenever a product or architecture decision is made. For feature work, the detail lives in the Project's decisions doc; `decisions.md` gets a one-line summary that points to it.
- Update `project-docs/technical-specifications.md` when the stack or a coding rule changes.
- No session handoff files. If work stops mid-task, write the next step under "In flight" in `PROJECT_STATUS.md`.
