# Git Workflow Guide - Athletic Tracker MVP

**Complete git workflow for multi-session development and production deployment**

## 🎆 **PRODUCTION DEPLOYMENT WORKFLOW (NEW - SEPTEMBER 17, 2025)**

### **Staging → Production Pipeline:**
```bash
# 1. Develop on staging branch
git checkout staging
# Make changes, test locally

# 2. Push to staging for testing
git add .
git commit -m "feat: Add new feature"
git push origin staging
# This deploys to: https://athletic-tracker-mvp.vercel.app

# 3. Test staging environment thoroughly
# Visit staging URL and validate changes

# 4. Deploy to production
git checkout main
git merge staging
git push origin main
# This deploys to: https://pbgb.ai and https://pbgb.io
```

### **Branch Strategy:**
- **staging branch** → Staging environment (athletic-tracker-mvp.vercel.app)
- **main branch** → Production environment (pbgb.ai, pbgb.io)

### **CRITICAL RULE:** Never push directly to main branch
**Always test changes on staging first!**

---

## 🔥 **MULTI-SESSION DEVELOPMENT WORKFLOW (CRITICAL)**

### **BEFORE starting ANY new session:**
```bash
# 1. Always pull latest changes first
git pull origin staging  # Pull staging branch for development
git pull origin main     # Pull main branch for reference

# 2. Check what branch you're on
git branch

# 3. Ensure you're on staging for development
git checkout staging

# 4. Check if you have uncommitted changes
git status
```

### **AFTER each session (NEVER skip this):**
```bash
# 1. Stage all changes
git add .

# 2. Commit with descriptive message
git commit -m "09/17/25 - Add voice analysis access to history page"

# 3. Push to staging branch
git push origin staging

# 4. Test staging deployment if needed
# Visit: https://athletic-tracker-mvp.vercel.app
```

### **IF you forget to push and start a new session:**
```bash
# When you realize you have unpushed local changes:

# 1. Check what you have locally
git log --oneline -5

# 2. Stash your current work
git stash push -m "WIP: current session changes"

# 3. Pull remote changes
git pull origin main

# 4. Apply your stashed changes back
git stash pop

# 5. Resolve any conflicts manually
# 6. Commit and push
git add .
git commit -m "Merged previous session changes"
git push origin main
```

### **BRUTAL PREVENTION RULE:**

**NEVER end a development session without these commands:**
```bash
git add .
git commit -m "Session complete - [brief description]"
git push origin staging  # Push to staging branch
git status  # Should show "nothing to commit, working tree clean"
```

**For production deployment after staging validation:**
```bash
git checkout main
git merge staging
git push origin main  # Deploy to production (pbgb.ai)
```

**Set a phone alarm or reminder** - seriously. The 30 seconds it takes to commit/push saves hours of merge hell later.

---

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
