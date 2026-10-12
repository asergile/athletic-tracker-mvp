# Technical specifications

**Last reviewed:** 2026-10-12
**Scope:** How code in this repo is written. Workflow rules (approvals, git, deploys, docs) live in `CLAUDE.md` at the repo root.

If this file disagrees with the code, the code wins. Fix this file.

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 14, App Router | File-based routes in `src/app/` |
| Language | TypeScript, `strict: true` | `.tsx` for components, `.ts` for utilities |
| UI | React 18, Tailwind CSS 3, Lucide icons | Mobile-first |
| Database and auth | Supabase (Postgres, Auth, Row Level Security) | Google OAuth and email/password |
| Voice transcription | AssemblyAI | Called server-side from `src/app/api/upload` |
| Workout analysis | Anthropic API (Claude Haiku) | Called server-side from `src/app/api/upload` and `src/app/api/reanalyze` |
| Hosting | Vercel | Builds from the `staging` branch |
| Tests | Vitest | `npm test` |

Check `package.json` for exact versions rather than copying them here.

The `openai` package is still installed but no code uses it. Remove it in the next dependency cleanup.

## Environment variables

| Variable | Where it's used | Exposed to the browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | Yes (safe; RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin client (`src/lib/supabase-admin.ts`) | **Never** |
| `ASSEMBLYAI_API_KEY` | Voice upload route | Never |
| `ANTHROPIC_API_KEY` | Upload and reanalyze routes | Never |

Real values live in `.env.local` (not in git) and in Vercel project settings. `.env.example` holds placeholders only.

## TypeScript and files

- TypeScript only. Files ending in `.js`, `.jsx` or `.backup` under `src/` are dead code. Don't import, edit or copy from them.
- No `any` unless there is a comment explaining why.
- Use `import type` for type-only imports.
- Shared types go in `src/types/`. Check there before creating a new type.

## Where new files go

| Kind of file | Location | Naming |
| --- | --- | --- |
| Page or route | `src/app/<route>/page.tsx` | lowercase route folder |
| API route | `src/app/api/<name>/route.ts` | kebab-case folder |
| Reusable component | `src/components/` | `PascalCase.tsx` |
| Hook | `src/hooks/` | `useThing.ts` |
| Utility | `src/lib/` | `kebab-case.ts` |
| Database helper | `src/lib/security/enhanced-db-helpers.ts` | add to the existing module |
| Test | `__tests__/` next to the code | `name.test.ts` |
| Migration SQL | `supabase/migration-drafts/` until applied | see "Database" below |
| UI mockup | `project-docs/mockups/` | `kebab-case.html` |

## React patterns

- **Never define a component inside another component.** It remounts on every render and causes the input-focus bug (inputs lose focus after one keystroke). Define components at module level and render conditionally.
- Global state: React Context only (auth today). Local state: `useState`. No Redux or Zustand.
- Every async action shows a loading state, a success confirmation and a readable error with a retry path.
- The root layout is a client component, so Next.js `metadata` and `viewport` exports don't apply there. Put head tags in the layout's `<head>` until that changes.

## Database

**Access**
- Client code goes through `src/lib/security/enhanced-db-helpers.ts`. Helpers check `supabase.auth.getUser()` first and filter by the user's id, even though RLS also enforces it.
- Validate user input with `src/lib/security/input-validation.ts` before writing.
- Use the service role key only in server code, and only when RLS has to be bypassed on purpose.
- Get the signed-in user's email from the auth session (`supabase.auth.getUser()`), never from a table.

**Schema rules**
- Every table has RLS enabled with explicit policies per operation.
- Never store a user's email outside `auth.users`. Other users may be able to read profile rows once sharing ships, and RLS filters rows, not columns.
- Every function sets `search_path` and has explicit `EXECUTE` grants. `anon` gets nothing unless the function is meant to be public.
- Prefer `SECURITY INVOKER`. Use `SECURITY DEFINER` only when the function must bypass RLS, and then check `auth.uid()` inside it.
- Private per-user data (date of birth and similar) goes in owner-only tables that never join into shared views.

**Migrations**
1. Write the SQL in `supabase/migration-drafts/`.
2. Review it, then apply it.
3. Move the applied file to `supabase/migrations/<timestamp>_<name>.sql` and add a rollback in `supabase/rollbacks/`.
4. Run the Supabase security advisor and fix new warnings.

Never put unapplied SQL in `supabase/migrations/`.

## Mobile and UX

- Primary targets: iOS Safari and Android Chrome. Test mobile first.
- Touch targets at least 44px.
- Must still work with large system text sizes (see the navigation pin in `pinned-items.md`).
- The core promise is logging a workout in under 30 seconds. Don't add steps to the logging path without a reason.

## Checks before proposing a commit

```bash
npm run type-check   # tsc --noEmit
npm run lint
npm test             # vitest
npm run build
```

Then test the changed flow in a mobile browser and check the console for errors.
