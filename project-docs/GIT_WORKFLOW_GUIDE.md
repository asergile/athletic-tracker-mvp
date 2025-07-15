# Git Workflow Guide - Athletic Tracker MVP

**Quick reference for what files to commit vs exclude from git operations**

## 🟢 **ALWAYS COMMIT TO GIT:**

### Core Application Files:
- `src/` - All React components and application code
- `public/` - Static assets and HTML templates
- `package.json` & `package-lock.json` - Dependencies
- Configuration files: `tailwind.config.js`, `eslint.config.mjs`, etc.
- `README.md` - Project documentation
- `SUPABASE_SETUP.md` - Setup instructions

### Project Documentation:
- `project-docs/mvp-requirements.md` - Feature specifications
- `project-docs/alpha-testing-protocol.md` - Testing strategy
- `project-docs/deployment-guide.md` - Deployment instructions
- `project-docs/supabase-implementation-plan.md` - Technical details
- Template files in `project-docs/` for future sessions

### Database & Configuration:
- `supabase/schema.sql` - Database schema
- `.gitignore` - Git exclusion rules

## 🔴 **NEVER COMMIT TO GIT:**

### Environment & Secrets:
- `.env.local` - Contains API keys and secrets
- Any file with actual API keys, passwords, or tokens

### Session-Specific Files:
- `project-docs/chat-summaries/` - Session summaries (local only)
- `project-docs/session-handoffs/` - Handoff prompts (local only)
- `SESSION_HANDOFF_PROMPT.md` - Current session prompt (local only)

### Development Files:
- `node_modules/` - Dependencies (recreated by npm install)
- `.next/` - Build artifacts
- Any temporary or cache files

### Personal/Internal Files:
- Files containing your personal information
- Internal strategy documents not meant for public repos
- Debug logs or temporary test files

## 📋 **COMMIT MESSAGE CONVENTIONS:**

### Format:
```
Type: Brief description (50 chars max)

Optional detailed description explaining what and why.
```

### Common Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code formatting (no logic changes)
- `refactor:` - Code restructuring (no functionality change)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Examples:
```
feat: Add Google OAuth authentication

Implement Supabase authentication with Google OAuth provider
and email/password fallback for user account management.
```

```
docs: Update README with Supabase setup instructions

Add step-by-step guide for configuring Supabase project
including environment variables and database schema.
```

## ⚡ **QUICK WORKFLOW:**

1. **Before Committing:**
   - Check session handoff for "FILES READY FOR GIT COMMIT" section
   - Verify no sensitive data in files
   - Test that application still works

2. **Git Commands:**
   ```bash
   git add [specific-files]  # Add only the files listed in session docs
   git commit -m "Type: Description"
   git push origin main
   ```

3. **After Committing:**
   - Update session status if needed
   - Continue with next development phase

## 🚨 **EMERGENCY FIXES:**

If you accidentally commit sensitive data:
1. **Immediately** change any exposed API keys/passwords
2. Use `git filter-branch` or BFG Repo-Cleaner to remove from history
3. Force push the cleaned history
4. Notify any team members to re-clone the repo

**Prevention:** Always double-check files before committing, especially `.env` files.
