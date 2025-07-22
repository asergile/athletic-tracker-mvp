# Best Practices: Working with Claude on Development Projects

**Based on Athletic Tracker MVP development experience**

## 🚨 CRITICAL SESSION STARTUP PROTOCOL

**BEFORE RESPONDING TO ANY REQUEST:**

### 1. READ REQUIRED STRATEGIC CONTEXT
- **FIRST:** `/project-docs/north-star-strategy.md` - Definitive business model and strategic vision
- **SECOND:** `/project-docs/project-status.md` - Current technical and development status

### 2. VALIDATE UNDERSTANDING
- Primary customers: Parents & coaches (not athletes)
- Athlete-first design with parent/coach monetization
- Voice processing was REMOVED (not deferred) - will rebuild in Phase 3
- Current focus: Alpha testing goal-driven athlete engagement

### 3. AVOID COMMON MISUNDERSTANDINGS
- ❌ Don't assume this is a direct-pay fitness app
- ❌ Don't suggest voice processing features (removed from codebase)
- ❌ Don't recommend athlete monetization strategies
- ❌ Don't ignore the parent/coach business model

**Failure to read north-star-strategy.md first will result in strategic misalignment and wasted session time.**

---

## 📁 **Project Organization & File Access**

### **Claude File System Access**
**IMPORTANT:** Claude has full access to the project file system at `/Users/alain/Projects/athletic-tracker-mvp/` and can:
- Read any file in the project directory structure
- View the complete codebase, configurations, and documentation
- Examine environment files, build configurations, and deployment settings
- Access all project documentation and session handoffs

**USE THIS ACCESS:** Instead of asking users to copy/paste code or describe files, directly examine the relevant files to understand issues, debug problems, and propose solutions.

### **Directory Structure**
```
project-root/
├── src/                          # Source code
├── public/                       # Static assets
├── project-docs/                 # All project documentation
│   ├── session-handoffs/         # Claude session transitions
│   │   ├── README.md            # How to use handoffs
│   │   ├── session-ender-template.md
│   │   └── YYYY-MM-DD-*.md      # Date-stamped handoffs
│   ├── project-status.md        # Current state (always updated)
│   ├── mvp-requirements.md      # Feature specifications
│   ├── session-log.md           # Decision history
│   └── alpha-testing-protocol.md # Testing strategy
├── PROJECT_STATUS.md             # Quick status at root
├── EMERGENCY_CORRECTION.md       # Claude confusion fixes
├── SUPABASE_SETUP.md            # Configuration guides
├── README.md                    # Public documentation
└── package.json                 # Dependencies
```

### **Documentation Principles**
- **Living documents:** Update as project evolves
- **Single source of truth:** Avoid duplicate information
- **Date everything:** Track when decisions were made
- **Be explicit:** Assume no prior context in handoffs

## 🔄 **Session Management Best Practices**

### **Starting Sessions**
1. **FIRST: Read technical specifications** - `project-docs/technical-specifications.md`
   - Adopt the **seasoned software architect persona** defined in the specs
   - Follow the decision-making framework and quality standards
2. **Then use handoff prompts** from previous session  
3. **Read project-status.md** to understand current state
4. **Confirm understanding** before taking any actions
5. **Ask for explicit approval** before coding or major changes

### **During Sessions**
1. **Follow the established workflow:**
   - Problem identification and analysis
   - Solution proposal with rationale
   - **"Should I implement this fix?"** - Wait for explicit approval
   - Implementation only after user confirmation ("Yes" or "Implement this")
   - Local testing before commits
   - User confirmation before deployment

2. **CRITICAL: Never auto-fix reported issues:**
   - User may share screenshots, errors, or bug reports
   - This is for **discussion and analysis ONLY**
   - Always propose solution and ask for approval first
   - Do not assume user wants immediate implementation

3. **Update documentation as you go:**
   - Update project-status.md with progress
   - Document major decisions in session-log.md
   - Create new files in appropriate directories

### **Ending Sessions**
1. **Use the session ending prompt** from `session-ending-prompt.md`
2. **Commit all work** to GitHub before ending
3. **Create session handoff** using template
4. **Update project-status.md** with current state
5. **Document next steps** clearly for continuation
6. **Test handoff** by reading it yourself

## 🛡️ **Protection Against Misunderstandings**

### **Critical Safeguards**
- **Multiple warnings** in handoff prompts about not rebuilding
- **Emergency correction files** for quick fixes
- **Clear project status indicators** at multiple levels
- **Explicit context** about what was eliminated (voice processing)
- **Required acknowledgments** in session starters

### **Handoff Prompt Requirements**
- ⚠️ **Critical warnings** at the top
- 🎯 **Current context** and phase
- ✅ **What was accomplished** this session
- 📍 **Current project status** 
- 🚫 **What NOT to do** (explicit list)
- ✅ **What TO do** (explicit instructions)
- 🔥 **Immediate next steps** (prioritized)
- 📊 **Success criteria** for current phase

## 💡 **Communication Best Practices**

### **User Preferences Integration**
- **Honor stated preferences:** "Brutal honesty and realistic takes"
- **Maintain project philosophy:** Simplicity beats sophistication
- **Respect technical comfort level:** Can handle config, prefers AI assistance
- **Remember background context:** PM with 20+ years 0-to-1 experience

### **Decision Making Protocol**
1. **Present options clearly** with pros/cons
2. **Make specific recommendations** based on experience
3. **Ask for explicit approval** before implementation
4. **Explain reasoning** for technical choices
5. **Be honest about limitations** and potential issues

## 🔧 **Technical Best Practices**

### **Code Management**
- **Never push without approval** - always test locally first
- **Commit frequently** with clear messages
- **Maintain existing patterns** unless explicitly changing them
- **Preserve user preferences** in code structure and style

### **Architecture Decisions**
- **Document rationale** for major architectural choices
- **Consider long-term maintenance** over quick implementations
- **Balance simplicity with functionality** based on project goals
- **Plan for phase transitions** (MVP → production → scale)

### **Quality Standards**
- **Production-ready code** from the start
- **Comprehensive documentation** for setup and usage
- **Error handling** and edge cases considered
- **Mobile-first responsive design** for user-facing features

## 📋 **File Management Best Practices**

### **Naming Conventions**
- **Session handoffs:** `YYYY-MM-DD-brief-description.md` with current date
- **Documentation:** `kebab-case-descriptive-names.md`
- **Templates:** `*-template.md` suffix for reusable files
- **Status files:** Clear, obvious names at appropriate levels

### **Content Organization**
- **Root level:** Only essential files (README, package.json, quick status)
- **project-docs/:** All comprehensive documentation
- **session-handoffs/:** Date-stamped transition documents
- **Emergency files:** Visible at root for quick access

### **Version Control**
- **Commit documentation** along with code changes
- **Update multiple files** in logical batches
- **Use descriptive commit messages** that explain the why
- **Tag major milestones** (Phase 1 complete, etc.)

## 🎯 **Success Patterns**

### **What Works Well**
- **Clear project phases** with defined completion criteria
- **Explicit approval workflows** that maintain user control
- **Comprehensive handoff prompts** that prevent misunderstandings
- **Living documentation** that stays current with project state
- **Emergency correction mechanisms** for quick course correction

### **What to Avoid**
- **Assuming continuation context** without explicit handoff prompts
- **Building without approval** based on general discussion
- **Complex multi-step solutions** without user validation
- **Outdated documentation** that doesn't reflect current state
- **Ambiguous next steps** that could be interpreted multiple ways

## 🚀 **Future Project Applications**

### **Template Creation**
- **Use this project structure** as template for future developments
- **Adapt handoff templates** for different project types
- **Maintain workflow protocols** across different technologies
- **Build reusable documentation patterns**

### **Scaling Considerations**
- **Team collaboration:** How multiple people use handoff system
- **Longer projects:** Managing handoffs across weeks/months
- **Multiple Claudes:** Ensuring consistency across different AI sessions
- **Enterprise use:** Adapting for larger, more complex projects

## 📈 **Continuous Improvement**

### **Regular Reviews**
- **Assess handoff effectiveness** after each session
- **Update templates** based on what works/doesn't work
- **Refine workflows** as project complexity changes
- **Document lessons learned** for future reference

### **Feedback Loops**
- **User satisfaction** with session transitions
- **Claude understanding** of project state
- **Documentation usefulness** for project continuity
- **Workflow efficiency** for getting things done

---

**This guide should be updated as we learn more about effective AI-assisted development workflows.**
