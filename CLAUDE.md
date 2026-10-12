# CLAUDE.md — PBGB

**Last reviewed:** 2026-10-12

Read this first in every session.

## What this is

PBGB (Personal Best Goal Buddy) is a voice-powered performance journal for athletes, live at pbgb.ai. It's a solo project: Alain is the product owner and only developer.

Stack and coding standards: `project-docs/technical-specifications.md`.

## Source of truth, in order

1. **Live systems:** the code on `staging`, git history, Supabase and Vercel. Check these before trusting any doc.
2. **`PROJECT_STATUS.md`:** current phase, work in flight, open decisions.
3. **Internal notes outside this repo:** decision log and infrastructure status (see "Docs" below).
4. **Specs (PRDs):** Claude Docs in the PBGB Claude Project.

Anything in `archive/` is history, not current state.

## Working rules

- Propose before changing code or files, and wait for explicit approval. Bug reports and screenshots are for discussion, not automatic fixes.
- Alain runs all git operations. Propose commit messages; never commit or push.
- `staging` is the deploy branch. Vercel builds every push to `staging`. Promotion to production is a manual step in the Vercel dashboard. `main` is stale.
- Database changes follow the migrations workflow in the tech spec: draft, approve, apply, then move into `supabase/migrations/` with a rollback.
- "Let's put a pin in that" means: add the item to `project-docs/pinned-items.md` (date, issue, cause, proposed fix, files) and carry on with the current task.

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

- Update `PROJECT_STATUS.md` when the phase, work in flight or open decisions change. Not every session.
- Add a line to `decisions.md` whenever a product or architecture decision is made.
- Update `project-docs/technical-specifications.md` when the stack or a coding rule changes.
- No session handoff files. If work stops mid-task, write the next step under "In flight" in `PROJECT_STATUS.md`.
