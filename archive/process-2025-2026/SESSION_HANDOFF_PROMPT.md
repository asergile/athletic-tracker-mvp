# Session Handoff Prompt — Athletic Tracker MVP

**Status as of:** Aug 11, 2026 — re-onboarding complete, deployment gap closed, app live and current
**Last real development activity:** Nov 25, 2025, branch `staging`
**Last deployment activity:** Aug 11, 2026 — promoted to production

## Context on this file

The previous version of this file was frozen from July 11, 2025 and told the next Claude session the project was "100% complete, do not build anything new, just help configure Supabase." That stopped being true almost immediately — five more months of feature work followed it (voice analysis, goals/events, onboarding, Performance Journal). Archived at `archive/root-docs-2025-07-to-09/SESSION_HANDOFF_PROMPT_2025-07-11.md`.

## Critical path restriction (still applies)

Only read/write files under `/Users/alain/Projects/athletic-tracker-mvp/`.

## Current real state

- **Branch:** `staging` (local HEAD `aecb6255`) is ahead of `main` (`4a60b5e`) — not merged, but this no longer blocks deployment since Vercel builds from `staging` directly
- **Last feature shipped:** Performance Journal calendar navigation + History→Journal rebrand (Nov 24–25, 2025)
- **Deployed:** confirmed live at `pbgb.ai` as of Aug 11, 2026, verified via Vercel API (`target: "production"` on commit `aecb6255`)
- **Still untested by real users:** the calendar feature is live but hasn't seen real alpha-user usage yet — worth watching for issues now that it's actually reachable
- **Resolved:** all previously-uncertain Supabase migrations (`is_archived`, `onboarding_completed`, `workout_analysis`) confirmed applied to production
- **New open item:** `athletic-tracker-mvp` is a second Vercel project deploying the same repo/branch with no custom domain — purpose unclear, worth a cleanup decision
- **New open item:** `user_settings` table has 0 rows despite 355 rows of real workout data — worth investigating

## 🚫 What not to do

- Don't assume the project is "complete" or "in testing phase only" — that framing was accurate for about two weeks in July 2025 and hasn't been since
- Don't merge `staging` → `main` without explicit approval — still outstanding, not done as part of the Aug 11 promotion
- Don't run git operations — user handles all git manually
- Don't build new features until priorities are set with the user for this next phase

## ✅ What to do at the start of a session

1. Read `PROJECT_STATUS.md` (root) for current state and known gaps
2. Read the latest file in `project-docs/session-handoffs/` by actual date
3. Ask the user what they want to work on before proposing anything
4. Follow the approval-required workflow: propose → explain rationale → ask "Should I implement this?" → wait for yes

## 👤 User context (unchanged)

- Prefers brutal honesty over optimistic hedging — no "maybes," no soft-pedaling risk
- PM with 20+ years bringing products 0→1
- Handles git manually; comfortable with configuration/testing, vibe-codes with AI assistance
- Core product thesis: "Log your workout in under 30 seconds. See your progress instantly." — simplicity over sophistication

---

**Suggested opening for next session:** "Continue with Athletic Tracker MVP — the app is live and current at pbgb.ai as of Aug 11, 2026. Help me decide what to work on next: merging staging into main, cleaning up the duplicate athletic-tracker-mvp Vercel project, investigating the empty user_settings table, or new feature work."
