# File Structure Reference - Athletic Tracker MVP

**Purpose:** Quick reference for file locations - eliminates need for directory tree searches  
**Last Updated:** October 6, 2025  
**Usage:** Reference this BEFORE doing directory tree requests to conserve tokens

---

## 📱 **Source Code (`src/`)**

### **App Routes (`src/app/`)**

| File | Purpose | Notes |
|------|---------|-------|
| `layout.tsx` | Root layout with AuthProvider | Exports metadata and viewport separately (Next.js 14 pattern) |
| `page.tsx` | Dashboard / Log workout page | Primary user entry point after auth |
| `goals/page.tsx` | Goals & Events management | Create/edit events and associated goals |
| `profile/page.tsx` | User profile and settings | Account management, preferences, sign out |
| `weekly-view/page.tsx` | Weekly workout visualization | Calendar view with edit modal functionality |
| `history/page.tsx` | Workout history list | Athlete-focused card design, full history |
| `voice-analysis/[workoutId]/page.tsx` | Log Book (AI workout details) | Dynamic route, renamed from "Voice Analysis" |
| `card-playground/page.tsx` | Design testing environment | Standalone UI component testing |
| `metrics-test/page.tsx` | Metrics debugging page | Isolated testing for data calculations |
| `debug/page.tsx` | Diagnostic tools | Development debugging utilities |

**Navigation Hidden Pages:**
- `/weekly-view` - Functional but removed from bottom nav

### **Components (`src/components/`)**

| File | Purpose | Status |
|------|---------|--------|
| `AthleticTracker.tsx` | Main dashboard/logging component | Active - Core feature |
| `StandardNavigation.tsx` | Bottom navigation bar (4 icons) | Active - Target, History, Goals, Profile |
| `WeeklyWorkoutView.tsx` | Weekly view component with edit modal | Active - Full edit functionality |
| `AuthScreen.tsx` | Login/signup UI | Active - Google OAuth + email/password |
| `VoiceRecorder.tsx` | Voice processing component | **Deferred to Phase 2** - Code preserved |
| `WorkoutReview.tsx` | Voice-to-data review UI | **Deferred to Phase 2** - Code preserved |

**Note:** Voice components exist but are not currently integrated. See `STRATEGIC_EVOLUTION_CONTEXT.md` for details.

### **Library (`src/lib/`)**

| File/Directory | Purpose | Critical Notes |
|----------------|---------|----------------|
| `supabase.ts` | Supabase client configuration | Uses anon key (safe for client-side) |
| `AuthContext.tsx` | Authentication state management | Handles 48-hour sessions, auto-logout |
| `security/enhanced-db-helpers.ts` | Secure database operations | **ALWAYS use for DB queries** |
| `security/` | Additional security utilities | Row Level Security helpers |
| `WorkoutDataContext.tsx` | Workout data caching | **Pinned for future** - Not yet implemented |

**Security Critical:** All database operations MUST use helpers from `security/` directory.

### **Types (`src/types/`)**
- TypeScript interfaces and type definitions
- Workout, Goal, Event, User types
- Check here before creating duplicate types

### **Styles (`src/styles/`)**
- `globals.css` - Global styles and Tailwind imports

---

## 📚 **Project Documentation (`project-docs/`)**

### **Core Documentation (Start Here)**

| File | When to Read | Priority |
|------|--------------|----------|
| `technical-specifications.md` | **FIRST** - Every session start | 🔴 Critical |
| `project-status.md` | Every session - Current state | 🔴 Critical |
| `claude-collaboration-best-practices.md` | Every session - Workflow | 🔴 Critical |
| `file-structure-reference.md` | Before searching for files | 🟡 High |

### **Implementation Guides**

| File | When to Reference | Priority |
|------|-------------------|----------|
| `supabase-security-implementation.md` | **ANY database work** | 🔴 Critical |
| `supabase-implementation-plan.md` | Database feature planning | 🟡 High |
| `deployment-guide.md` | Deploying to production | 🟡 High |
| `mvp-requirements.md` | Feature discussions | 🟢 Medium |

### **Strategic Context**

| File | When to Reference | Purpose |
|------|-------------------|---------|
| `STRATEGIC_EVOLUTION_CONTEXT.md` | When voice features mentioned | Explains Phase 1/2 strategy |
| `pinned-items.md` | Before suggesting deferred work | Lists postponed issues |
| `session-log.md` | Understanding past decisions | Historical context |

### **Session Management (`session-handoffs/`)**

| File | Purpose |
|------|---------|
| `README.md` | How to use handoff system |
| `session-ender-template.md` | Template for new handoffs |
| `YYYY-MM-DD-*.md` | Date-stamped session transitions |

**Usage:** Check latest handoff when continuing previous session.

### **Design Artifacts (`mockups/`)**

| Directory/File | Contents |
|----------------|----------|
| `design-wireframes/` | Interactive HTML prototypes |
| `onboarding-wireframe.html` | 3-screen onboarding flow |
| `onboarding-with-logo.html` | Branded version with PB logo |

**Note:** All interactive prototypes should be saved here, not in src/

---

## 🎨 **Public Assets (`public/`)**

### **Images (`public/images/`)**
- `Logo PB white.png` - Primary logo (white for dark backgrounds)
- Additional brand assets as needed

**Path Reference:** In HTML/React, use `/images/filename.png` (leading slash important)

---

## ⚙️ **Configuration Files (Root)**

| File | Purpose | Notes |
|------|---------|-------|
| `package.json` | Dependencies and scripts | Check versions here |
| `tsconfig.json` | TypeScript configuration | Strict mode enabled |
| `tailwind.config.js` | Tailwind CSS configuration | Custom colors and utilities |
| `next.config.js` | Next.js configuration | Build and deployment settings |
| `.env.local` | Environment variables | **NOT in git** - Local only |
| `.gitignore` | Git exclusions | Keep updated with new patterns |

**Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🔍 **Quick Search Patterns**

### **Instead of Full Directory Tree:**

```bash
# Find component files
filesystem:search_files pattern="*.tsx" path="/Users/alain/Projects/athletic-tracker-mvp/src/components"

# Find all page routes
filesystem:search_files pattern="page.tsx" path="/Users/alain/Projects/athletic-tracker-mvp/src/app"

# Find security-related files
filesystem:search_files pattern="security" path="/Users/alain/Projects/athletic-tracker-mvp/src/lib"

# Find documentation about X
filesystem:search_files pattern="supabase" path="/Users/alain/Projects/athletic-tracker-mvp/project-docs"
```

### **Common File Patterns:**

| Looking For | Search Pattern | Path |
|-------------|----------------|------|
| Components | `*.tsx` | `src/components` |
| Pages/Routes | `page.tsx` | `src/app` |
| Utilities | `*.ts` | `src/lib` |
| Type definitions | `*.ts` | `src/types` |
| Documentation | `*.md` | `project-docs` |
| Configs | `*.config.*` | root |

---

## 📊 **File Organization Rules**

### **Where to Put New Files:**

| File Type | Location | Example |
|-----------|----------|---------|
| New page/route | `src/app/route-name/page.tsx` | `src/app/settings/page.tsx` |
| Reusable component | `src/components/ComponentName.tsx` | `src/components/GoalCard.tsx` |
| Utility function | `src/lib/utility-name.ts` | `src/lib/date-helpers.ts` |
| Type definition | `src/types/type-name.ts` | `src/types/workout.ts` |
| Documentation | `project-docs/doc-name.md` | `project-docs/api-guide.md` |
| Design mockup | `project-docs/mockups/name.html` | `project-docs/mockups/goal-form.html` |
| Session handoff | `project-docs/session-handoffs/YYYY-MM-DD-topic.md` | `2025-10-06-auth-fix.md` |

### **Naming Conventions:**

- **Components:** PascalCase - `WorkoutCard.tsx`
- **Pages:** lowercase - `page.tsx`
- **Utilities:** kebab-case - `date-helpers.ts`
- **Documentation:** kebab-case - `setup-guide.md`
- **Mockups:** kebab-case - `onboarding-flow.html`

---

## 🚨 **Critical File Relationships**

### **Authentication Flow:**
1. `src/app/layout.tsx` → Wraps app in AuthProvider
2. `src/lib/AuthContext.tsx` → Manages auth state
3. `src/components/AuthScreen.tsx` → Login/signup UI
4. `src/lib/supabase.ts` → Supabase client config

### **Database Operations:**
1. `src/lib/supabase.ts` → Client instance
2. `src/lib/security/enhanced-db-helpers.ts` → Secure query functions
3. Any component → **MUST use helpers**, never direct queries

### **Data Flow:**
1. User action in component
2. Call helper from `enhanced-db-helpers.ts`
3. Helper checks auth via `AuthContext`
4. Supabase query with RLS policies
5. Component updates with result

---

## 💡 **Token-Saving Tips**

### **Before Doing Large Operations:**

1. **Check this file first** - Most structure questions answered here
2. **Use targeted search** - Search for specific file patterns
3. **Read relevant docs** - Often contains file paths in examples
4. **Ask user** - "Is ComponentName.tsx in src/components?" (Quick answer)

### **When You Need Directory Info:**

**Good:**
- "Checking file-structure-reference.md for location of AuthScreen.tsx"
- "Searching for files matching pattern 'auth' in src/"

**Avoid:**
- "Let me get the full directory tree" (expensive)
- Searching entire project for single file

### **Update This File:**

When adding new major files/directories, update this reference so future Claude instances benefit.

---

## 📝 **Version History**

| Date | Change | Reason |
|------|--------|--------|
| 2025-10-06 | Created file | Reduce token usage from directory tree requests |

---

**Remember: This file should be the FIRST stop before searching the filesystem. It will save significant tokens and speed up responses.**
