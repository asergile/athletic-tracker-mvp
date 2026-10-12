# Session Handoffs Directory

**Purpose:** Organized storage for Claude session transition documents and templates.

## 📁 **Directory Structure:**

```
session-handoffs/
├── session-ender-template.md     # Reusable template for ending sessions
├── 2025-07-11-phase1-complete.md # Ready handoff for next session
└── README.md                     # This file
```

## 🎯 **How to Use:**

### **Starting Your Next Claude Session:**
1. **Open:** `2025-07-11-phase1-complete.md` (most recent handoff)
2. **Copy:** Entire file content
3. **Paste:** As first message in new Claude session
4. **Result:** Claude will have complete context and proper constraints

### **Ending Future Sessions:**
1. **Copy:** `session-ender-template.md`
2. **Customize:** Replace [bracketed placeholders] with actual details
3. **Save:** As new file with date format: `YYYY-MM-DD-description.md`
4. **Use:** Customized version for next session handoff

## 📋 **File Naming Convention:**
- **Format:** `YYYY-MM-DD-brief-description.md`
- **Examples:** 
  - `2025-07-12-supabase-configured.md`
  - `2025-07-15-alpha-testing-started.md`
  - `2025-07-20-phase2-planning.md`

## 🛡️ **Emergency Files (at project root):**
- **`EMERGENCY_CORRECTION.md`** - Quick fix if Claude misunderstands
- **`PROJECT_STATUS.md`** - Current project state summary

## ✅ **Best Practices:**
1. **Always create handoff** when ending sessions with significant progress
2. **Date-stamp files** for easy chronological tracking
3. **Keep templates updated** as project evolves
4. **Test handoffs** by reading them yourself first
5. **Update emergency files** when project status changes significantly

## 🚀 **Next Session:**
**Use:** `2025-07-11-phase1-complete.md` to continue with Supabase configuration and testing.
