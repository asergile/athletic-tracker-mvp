# PROJECT STATUS

**Last verified:** August 11, 2026
**Production status:** ✅ Live at [pbgb.ai](https://pbgb.ai)

## Where things stand

PBGB (Goal Buddy) is live and in active use. A batch of work — a Performance Journal calendar view, timezone fixes, and a History → Journal rebrand — recently shipped to production after being built but sitting undeployed for a while.

## What's built

- **Core logging:** manual 3-field workout entry, cloud sync
- **Auth:** Google OAuth + email/password
- **Goals & Events:** create events, set training goals, archive/unarchive
- **Onboarding:** 3-screen carousel + first-goal creation flow
- **Voice-to-text workout analysis:** speak a workout description, get it parsed into structured data
- **Performance Journal:** calendar-based history view with timezone-correct dates

## Architecture

- **Framework:** Next.js 14, App Router, TypeScript
- **Backend:** Supabase (Postgres, Auth, Row Level Security)
- **Styling:** Tailwind CSS
- **AI:** Claude for workout analysis, AssemblyAI for voice transcription
- **Deployment:** Vercel

## Known follow-ups

- Investigating an anomaly in one settings table despite active app usage
- General branch/deployment hygiene cleanup pending
- A couple of dependencies are past end-of-support and due for a bump

## Where to look for more detail

- `project-docs/session-handoffs/` — chronological session log
- `PROMPT_MANAGEMENT.md` (root) — voice-analysis prompt versioning system

---
*Infrastructure-level detail (hosting IDs, table-level metrics, deployment topology) is intentionally not included in this file.*
