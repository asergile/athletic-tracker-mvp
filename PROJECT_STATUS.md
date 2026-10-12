# Project status

**Last updated:** 2026-10-12
**Production:** live at [pbgb.ai](https://pbgb.ai)

## What's live

- Workout logging: quick manual entry, plus voice logging with AI analysis of the workout
- Goals and events with progress tracking, archive and unarchive
- Onboarding: intro screens and first-goal creation
- Performance Journal: calendar view of workout history
- Sign-in with Google or email and password

## Current phase

Foundations for profiles and sharing. The spec is a PRD in the PBGB Claude Project.

## In flight

- Database security hardening: applied and verified.
- Profile and identity schema changes: drafted in `supabase/migration-drafts/`, not applied.
- Next: build the onboarding and backfill screen for the new profile fields, then apply the drafts.

## Open decisions

- Open questions in the profiles and sharing PRD.
- Pricing model (under consideration).

## Backlog

- Pinned items in `project-docs/pinned-items.md`: navigation at large text sizes, data caching between pages.
- Cleanup:
  - Dead files in `src/lib` (`database-functions.js`, `shared-events-helpers.js`, `*.backup`)
  - Debug and test pages reachable in production (`/debug`, `/voice-test`, `/metrics-test`, `/card-playground`)
  - Root-level check scripts and logs (`*.sh`, `*.log`)
  - Unused `openai` dependency
  - Upgrade `eslint` 8 (past end of support)
  - Merge or retire the stale `main` branch
