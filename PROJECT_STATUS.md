# Project status

**Last updated:** 2026-11-08
**Production:** live at [pbgb.ai](https://pbgb.ai)

## What's live

- Workout logging: quick manual entry, plus voice logging with AI analysis of the workout
- Log page Activity Grid: calendar heatmap of recent weeks, colored by how each workout felt
- History: month calendar with a collapsing week strip, and that month's workouts; "Add workout for <date>"
- Trends: Week and Month totals per activity (distance or time), compared with the previous period, plus weekly goal progress; Season totals for any season that has started
- Seasons: named date ranges (a sport's season or a training block) set up in Profile › Seasons
- Performance Journal: per-workout page with the voice transcription and AI analysis, opened from a History workout card or right after a voice note
- Goals and events with progress tracking, archive and unarchive
- Profiles: username, display name, 13+ age gate; change password
- Onboarding: intro screens and first-goal creation
- Sign-in with Google or email and password

## Current phase

The Activity Grid / History / Trends / Seasons work (Phases 1–4) and Phase 5 (cleanup and hardening) are in production. The plan, phase history and design decisions are in the PBGB Claude Project (`claude/activity-grid-implementation-plan.md`, `claude/activity-grid-decisions.md`).

Next: Phase 6, rethinking the Journal (design first).

## In flight

- Nothing in flight.

## Open decisions

- Open questions in the profiles and sharing PRD.
- Pricing model (under consideration).
- Journal: what it should be and how athletes reach it (Phase 6).

## Backlog

- Pinned items in `project-docs/pinned-items.md`: navigation at large text sizes, data caching between pages.
- Phase 6 (Journal): no way to delete a workout in the app; the AI analysis shows raw markdown; "no workout detected" shows an internal error code.
- 9 lint warnings (React hook dependencies, one `<img>`): fix when working in those files.
- Upgrade to Next 15 and ESLint 9 (ESLint 8 is past end of support).
- Set up a custom email sender for sign-in emails before a growth push.
- `project-docs/deployment-guide.md` predates the move to Next.js: rewrite or remove.
- Later items for the Activity Grid work (Career view, loading workouts by date range instead of the 500 cap, helping athletes fill in missing distance, and more) are listed in the implementation plan.
