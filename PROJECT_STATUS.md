# Project status

**Last updated:** 2026-11-08
**Production:** live at [pbgb.ai](https://pbgb.ai)

## What's live

- Workout logging: quick manual entry, plus voice logging with AI analysis of the workout
- Log page Activity Grid: calendar heatmap of recent weeks, colored by how each workout felt
- History: month calendar with a collapsing week strip, and that month's workouts; "Add workout for <date>"
- Trends: Week and Month totals per activity (distance or time), compared with the previous period, plus weekly goal progress
- Performance Journal: per-workout page with the voice transcription and AI analysis, opened from a History workout card
- Goals and events with progress tracking, archive and unarchive
- Profiles: username, display name, 13+ age gate; change password
- Onboarding: intro screens and first-goal creation
- Sign-in with Google or email and password

## Current phase

Activity Grid / History / Trends / Seasons. Phases 1–3 are in production. Phase 4 (Seasons: Profile › Seasons card and the Trends Season tab) is on `staging`, waiting to be promoted. The plan, phase history and design decisions are in the PBGB Claude Project (`claude/activity-grid-implementation-plan.md`, `claude/activity-grid-decisions.md`).

Next: Phase 5, cleanup and hardening. Then Phase 6, rethinking the Journal (design first).

## In flight

- Phase 4 (Seasons) on `staging`: promote to production when ready. Its database table is already applied.

## Open decisions

- Open questions in the profiles and sharing PRD.
- Pricing model (under consideration).
- Journal: what it should be and how athletes reach it (Phase 6).

## Backlog

- Pinned items in `project-docs/pinned-items.md`: navigation at large text sizes, data caching between pages.
- Phase 5 (cleanup and hardening):
  - Endless loading screen when scripts fail to load or a request never returns: add a timeout with a Reload button
  - `src/lib/supabase.js` shadows `supabase.ts` (they differ); end up with one file
  - Dead files in `src/lib` (`database-functions.js`, `shared-events-helpers.js`, `supabase-test.js`, `*.backup`) and `src/lib/security` (`secure-*.js`, `security-test-suite.js`)
  - Remove debug and test pages from production builds
  - Root-level check scripts and logs (`*.sh`, `*.log`)
  - Unused `openai` and `date-fns` dependencies
  - Set up ESLint (`npm run lint` has no config) and upgrade from `eslint` 8 (past end of support)
  - Names with apostrophes are stored HTML-escaped (`'` becomes `&#x27;`) for events and custom activities
  - Ignore `Claude outputs/` and `Screenshots/`
  - Merge or retire the stale `main` branch
- Later items for the Activity Grid work (Career view, loading workouts by date range instead of the 500 cap, helping athletes fill in missing distance, and more) are listed in the implementation plan.
