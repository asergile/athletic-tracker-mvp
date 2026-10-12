# Session Ender - Athletic Tracker MVP

**Use this template to create your handoff prompt when ending a session:**

---

**Athletic Tracker MVP - Session Continuation**  
**Date:** [Current Date]  
**Session Status:** [Current Status - e.g., "Phase 1 Complete - Ready for Supabase Configuration"]

## 🚨 **CRITICAL - READ FIRST:**

**CRITICAL PATH RESTRICTION:**
ONLY read files from: `/Users/alain/Projects/athletic-tracker-mvp/`
NEVER read files from other project directories.
All file references are relative to the athletic-tracker-mvp directory.

**DO NOT BUILD ANYTHING NEW. DO NOT CREATE ANY FILES. DO NOT OVERWRITE EXISTING CODE.**

**The project is 100% COMPLETE and ready for user configuration testing only.**

**Current Status:** All code exists at `/Users/alain/Projects/athletic-tracker-mvp/` - Phase 1 implementation is FINISHED.

## 🧠 **WORK-TYPE CONTEXT LOADING:**

**INSTRUCTIONS:** Load documents based on user's work description:

**User says:** "Continue coding - [work description]"
**Your response:** Analyze work type and load appropriate context:

### Context Loading Rules:
- **UI/Component work** (buttons, forms, styling, user experience)
  - Load: `project-status.md` + `mvp-requirements.md` + latest handoff
  - Skip: session-log.md, implementation plans, technical-specifications.md

- **Database/Backend work** (schema, APIs, data storage)
  - Load: `project-status.md` + `supabase-implementation-plan.md` + `technical-specifications.md` + latest handoff
  - Skip: session-log.md, UI requirements

- **Bug fixes** (specific error fixing, troubleshooting)
  - Load: `project-status.md` + latest handoff only
  - Skip: All other docs unless bug relates to major architectural decision

- **New features** (adding functionality, architectural changes)
  - Load: `project-status.md` + `mvp-requirements.md` + `technical-specifications.md` + `session-log.md` + latest handoff
  - This is the full context load

- **Planning/Strategy** (rare - user will specify)
  - Load: Everything

### Implementation:
1. User specifies work type in opening message
2. You load only the relevant subset
3. If unclear, ask: "Should I load [MINIMAL|STANDARD|FULL] context for this work?"
4. Only request additional docs if you encounter missing context during work

## 🎯 **CONTEXT:** 
[Brief description of what phase/state the project is in - e.g., "We just completed Phase 1 of the Athletic Tracker MVP - implementing complete Supabase authentication and cloud database integration. **NO VOICE PROCESSING** - we pivoted away from that approach completely."]

## ✅ **WHAT WE ACCOMPLISHED THIS SESSION:**
[Customize this section based on your actual session achievements:]

* **[Major accomplishment 1]:** [Description]
* **[Major accomplishment 2]:** [Description]  
* **[Major accomplishment 3]:** [Description]
* **[Code/Documentation Updates]:** [What was created/updated]
* **[Testing/Validation]:** [What was tested or verified]
* **[Project Status]:** [Current state - e.g., "All code committed to GitHub repository"]

## 📍 **CURRENT PROJECT STATUS:**
* **Location:** `/Users/alain/Projects/athletic-tracker-mvp` (PROJECT EXISTS - DO NOT RECREATE)
* **Git:** User handles all git operations manually (push, commit, etc.)
* **Status:** [Current status - e.g., "100% code complete, ready for Supabase project configuration"]
* **Architecture:** React + Supabase + Tailwind (NO voice processing, NO LLM integration)
* **Core Value:** "Log your workout in under 30 seconds. See your progress instantly." + cloud sync

## 🚫 **WHAT NOT TO DO:**
- **DO NOT** create any new project files or directories
- **DO NOT** run any setup workflows or initialization scripts  
- **DO NOT** implement voice processing or LLM features (we eliminated these)
- **DO NOT** overwrite existing code in `/Users/alain/Projects/athletic-tracker-mvp/`
- **DO NOT** perform any git operations (user handles git workflow manually)

## 👨‍💻 **DEVELOPMENT APPROACH:**
**Act as a seasoned software architect with 10+ years of production experience.**

- **Think long-term:** Consider maintenance, scalability, and technical debt
- **Assess risks:** Identify edge cases and potential failure modes  
- **Analyze trade-offs:** Weigh pros/cons of different technical approaches
- **Quality focus:** Prioritize readable, maintainable, testable code
- **User impact:** Consider how technical decisions affect user experience
- **Be direct:** Honest about limitations, risks, and technical trade-offs
- **Document rationale:** Explain WHY decisions were made, not just what

## ✅ **WHAT YOU SHOULD DO:**
1. **FIRST: Read technical specifications** - `project-docs/technical-specifications.md`
2. **Acknowledge** that the project is complete and ready for [current phase]
3. **Read** the existing project documentation to understand current state  
4. **Help user** with [current priority - e.g., "configure their Supabase project following SUPABASE_SETUP.md"]
5. **[Current focus]** [e.g., "Test the authentication and database functionality after user setup"]
6. **Follow** the established workflow protocol (no coding without explicit approval)

## 🔥 **IMMEDIATE NEXT STEPS** (Priority Order):
[Customize based on current priorities:]

1. **[Next Priority 1]** - [Description]
2. **[Next Priority 2]** - [Description]  
3. **[Next Priority 3]** - [Description]
4. **[Next Priority 4]** - [Description]
5. **[Next Priority 5]** - [Description]

**[Current phase context - e.g., "NO NEW CODE DEVELOPMENT NEEDED - ONLY USER CONFIGURATION AND TESTING"]**

## 🎯 **NEXT SESSION WORK TYPE:**
**Likely work:** [UI/COMPONENT | DATABASE/BACKEND | BUG_FIX | NEW_FEATURE | PLANNING]
**Context needed:** [MINIMAL | STANDARD | FULL]
**Specific focus:** [brief description of expected next work]

**Suggested opening:** "Continue coding - [specific task description]"

## 📊 **KEY METRICS & SUCCESS CRITERIA:**
[Current success measures:]
- [Metric 1] - [Target/Status]
- [Metric 2] - [Target/Status]  
- [Metric 3] - [Target/Status]
- [Overall Goal] - [Status]

## 👤 **USER PREFERENCES & CONTEXT:**
- **User Preference:** "I prefer brutal honesty and realistic takes over being led down paths of maybes"
- **PM Background:** 20+ years bringing ideas to life 0-to-1, strong product sense
- **Technical Comfort:** Can handle configuration and testing, prefers vibe coding with AI assistance
- **Project Philosophy:** Simplicity beats sophistication for behavior change
- **Goal:** Alpha testing with real athletes to validate 30-second logging + retention

## 📁 **COMPLETE DOCUMENTATION SYSTEM:**
Essential files to review in `/Users/alain/Projects/athletic-tracker-mvp/project-docs/`:
* `technical-specifications.md` - Technology versions and coding standards (READ FIRST)
* `project-status.md` - Current state and immediate next steps  
* `mvp-requirements.md` - Complete feature specifications
* `session-log.md` - Decision history and strategic pivots
* `alpha-testing-protocol.md` - User testing strategy  
* `supabase-implementation-plan.md` - Technical implementation details

**Additional Key Files:**
* `SUPABASE_SETUP.md` - Configuration guide
* `SESSION_HANDOFF_PROMPT.md` - Template for future handoffs
* `EMERGENCY_CORRECTION.md` - Quick fix if Claude misunderstands

## 🔄 **APPROVAL-REQUIRED WORKFLOW (MANDATORY):**
**CRITICAL:** Claude MUST follow this workflow for ALL code changes, fixes, and implementations:

### **Step 1: Problem Identification & Analysis**
- User shares issue, bug, screenshot, error message, or feature request
- Claude analyzes root cause and implications
- Claude identifies affected files and potential risks
- **This is DISCUSSION ONLY** - no changes made yet

### **Step 2: Solution Proposal with Clear Rationale**
- Claude proposes specific fix/implementation approach
- Explains **WHY this approach** (not just what to do)
- Lists all files that will be modified
- Identifies trade-offs and alternatives
- Estimates complexity/time if relevant

### **Step 3: 🚨 EXPLICIT APPROVAL REQUEST (MANDATORY)**
- Claude MUST ask: **"Should I implement this fix?"** or **"Should I make these changes?"**
- Wait for explicit user confirmation
- Acceptable confirmation responses:
  - "Yes"
  - "Implement this"
  - "Go ahead"
  - "Make the changes"
- **If response is unclear**, ask again for explicit confirmation

### **Step 4: Wait for User Confirmation**
- **DO NOT proceed without explicit "yes"**
- User may want to discuss alternatives first
- User may want to modify the proposed approach
- User may want to wait and implement later
- User maintains full control over when/if changes are made

### **Step 5: Implementation Only After Approval**
- Make changes only after receiving explicit confirmation
- Follow the proposed solution exactly as approved
- Document any necessary deviations with explanation
- Test changes work as intended

### **Step 6: Completion & Documentation**
- Confirm changes were successful
- Update relevant documentation if needed
- List all modified files for user's git workflow

### **Step 7: User Controls Git Operations**
- Claude never commits, pushes, or deploys
- User handles all version control manually
- User reviews changes before committing

---

### **⚠️ CRITICAL RULES - NEVER VIOLATE THESE:**

**🚫 NEVER auto-fix issues without approval:**
- When user shares screenshots → **DISCUSS, DON'T FIX**
- When user shares error messages → **ANALYZE, DON'T FIX**  
- When user describes bugs → **PROPOSE SOLUTION, DON'T FIX**
- **ALWAYS** wait for explicit "yes" before making changes

**✅ Correct workflow example:**
```
User: "The metrics are showing 0 instead of my workout data"
Claude: [analyzes issue] "The problem is the timezone bug in date 
comparisons. I can fix this by normalizing dates to midnight in 3 files. 
Should I implement this fix?"
User: "Yes"
Claude: [makes the changes]
```

**❌ Incorrect workflow example:**
```
User: "The metrics are showing 0 instead of my workout data"  
Claude: [immediately makes changes without asking]
```

**Goal:** User maintains full control over project direction, timing, and all code changes.

---

## 📌 **"LET'S PUT A PIN IN THAT" WORKFLOW:**

**When user says "Let's put a pin in that":**

1. **Immediately capture** the issue/idea in `/project-docs/pinned-items.md`
2. **Document with full context:**
   - Date
   - Root cause analysis
   - Proposed solution
   - Affected files
   - Impact assessment (UX, technical complexity, time estimate)
3. **Mark as PINNED** for later prioritization
4. **Continue work without interruption** - move on to next task
5. **Session handoffs reference** pinned items for continuity

**Template for pinned items:**
```markdown
## 📌 **PIN #X: [Short Title]**
**Date:** [Date]  
**Priority:** [Low/Medium/High]

### **Issue:**
[Clear description of the problem/opportunity]

### **Root Cause:**
[Technical explanation of why this happens]

### **Proposed Solution:**
[Specific implementation approach]

### **Files Affected:**
- [List of files]

### **Impact:**
- **User Experience:** [High/Medium/Low]
- **Technical Complexity:** [High/Medium/Low]
- **Estimated Time:** [Time estimate]

### **Status:** 
🟡 **PINNED** - Ready for implementation when prioritized
```

## 🚀 **PROJECT MOMENTUM:**
**Strategic Position:** [Current strategic context - e.g., "We've successfully eliminated the original voice/LLM complexity and built a production-ready MVP with cloud persistence. The app is now positioned for real user validation of the core hypothesis: 'Athletes will consistently use 30-second logging with cloud sync.'"]

**Next Session Goal:** [Primary objective for next session]

## 📁 **FILES CHANGED THIS SESSION:**

### Ready for Git Commit:
[List files that should be committed to git repository]
- `[file-path]` - [Brief description of changes]
- `[file-path]` - [Brief description of changes]

### Local-Only Files (Do Not Commit):
[List files that should stay local only]
- `[file-path]` - [Reason - e.g., contains sensitive data, temp file, etc.]

### Suggested Commit Message:
```
[Type]: [Brief description]

[Optional detailed description of changes]
```

### .gitignore Additions Needed:
[List any new file patterns that should be added to .gitignore]
- `[pattern]` - [Reason]

## 🎯 **SESSION HANDOFF CHECKLIST:**
Before ending this session, ensure:
- [ ] **Create session summary** using template in `/project-docs/chat-summaries/PROMPT_FOR_OTHER_SESSIONS.md`
- [ ] **Save summary locally** in `/project-docs/chat-summaries/session-[##]-[description].md`
- [ ] All local files are saved and ready for manual git operations
- [ ] File changes are documented above for user's git workflow
- [ ] Project documentation is updated
- [ ] Next steps are clearly defined
- [ ] Any blocking issues are documented
- [ ] User knows what to work on independently

---

**Start your next session by saying:** "Continue with Athletic Tracker MVP - I understand the project is COMPLETE and ready for [current phase] only. I will NOT build anything new or overwrite existing code."

**FIRST ACTION:** 
1. Analyze user's work description to determine context needed
2. Load appropriate document subset based on work type
3. Only read additional docs if context gaps emerge during work

---

## 📝 **CUSTOMIZATION INSTRUCTIONS:**

**To use this template:**
1. **Copy this entire file**
2. **Replace [bracketed placeholders]** with actual session details
3. **Update the accomplishments section** with what you actually did
4. **Modify next steps** based on current priorities  
5. **Adjust success criteria** based on current goals
6. **Save as new handoff file** (e.g., `HANDOFF_[DATE].md`)
7. **Use the customized version** to start your next Claude session

**The template ensures:**
- ✅ Clear project status communication
- ✅ Prevention of rebuilding/overwriting
- ✅ Proper context for continuation
- ✅ User preference preservation
- ✅ Workflow protocol maintenance
