# CLAUDE SESSION START INSTRUCTIONS

**READ THIS FIRST — BEFORE ANY OTHER DOCUMENT**

## Context on this file

An older version of this file said the project was "a simple 3-field manual workout tracker" and that voice processing was abandoned. That was true for a few weeks in July 2025 and has not been true since. The project kept evolving after that snapshot was written, and nobody updated the file — a good cautionary example of why every doc in this repo needs a date and needs to actually get updated. The old version is archived at `archive/root-docs-2025-07-to-09/CLAUDE_SESSION_START_2025-07-11.md`.

## Where things actually stand

**Last commit:** Nov 25, 2025, on branch `staging`. User returned to the project after ~8 months away in Aug 2026, did a full re-onboarding audit, and promoted the pending work to production on Aug 11, 2026.

**What's built:** manual workout logging + voice-based workout logging (AssemblyAI + Claude) + Goals/Events with progress tracking + onboarding flow + Performance Journal with calendar navigation. This is a materially bigger app than the July MVP. **All of it is now live** at `pbgb.ai`.

**Branch state:** `main` and `staging` have diverged — recent work never got merged to `main`, but that's now orthogonal to deployment (Vercel builds and deploys from `staging` directly, not `main`). `staging` is both the source of truth for what was built and what's live. `main` merge is still outstanding cleanup, not a blocker.

## 📁 SOURCE OF TRUTH — read in this order

1. `PROJECT_STATUS.md` (root) — current state, known gaps, immediate next steps
2. `project-docs/session-handoffs/` — most recent file by date is the last real session; check the actual date in the filename, not just the newest-looking one
3. `project-docs/project-status.md` — longer running log, but read for content not for its header date (it's not maintained chronologically)

## 🚫 Don't assume these are current without checking the date in the file itself

Every doc in this repo needs to be read with its date visible. Several docs in this project have gone stale mid-conversation before (this file included). If a doc doesn't have a clear date, check `git log` on that file before trusting it.

## 🔄 WORKFLOW PROTOCOL (unchanged, still applies)
1. Never code without explicit approval
2. Read `PROJECT_STATUS.md` and the latest session handoff before proposing anything
3. Ask "Should I implement this?" before any changes
4. User handles all git operations manually — propose commits, don't run them
