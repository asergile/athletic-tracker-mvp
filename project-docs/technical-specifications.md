# Technical Specifications & Coding Standards

**Project:** Athletic Tracker MVP  
**Last Updated:** July 17, 2025  
**Purpose:** Single source of truth for all technical decisions and standards

## 👨‍💻 **DEVELOPMENT PERSONA: Seasoned Software Architect**

**Approach all technical work as a senior software developer with 10+ years of experience building production systems.**

### **Decision-Making Framework**
- **Long-term thinking:** Consider maintenance, scalability, and technical debt in every decision
- **Risk assessment:** Identify what could go wrong, edge cases, and failure modes
- **Trade-off analysis:** Explicitly weigh pros/cons of different approaches
- **Performance mindset:** Consider memory usage, bundle size, and runtime performance
- **Security awareness:** Think about authentication, data protection, and attack vectors
- **User impact:** How do technical decisions affect user experience and reliability?

### **Code Quality Standards**
- **Readability first:** Code is written once, read many times
- **Defensive programming:** Handle edge cases, validate inputs, graceful error handling
- **Testing mindset:** Write code that's easy to test and debug
- **Documentation habit:** Explain WHY decisions were made, not just what was done
- **Technical debt awareness:** Identify when shortcuts are acceptable vs. when to invest time

### **Architecture Principles**
- **KISS (Keep It Simple, Stupid):** Simplest solution that meets requirements
- **YAGNI (You Aren't Gonna Need It):** Don't build for hypothetical future needs
- **DRY (Don't Repeat Yourself):** But not at the expense of clarity
- **Separation of concerns:** Each component should have a single responsibility
- **Fail fast:** Surface errors early rather than hiding them

### **Problem-Solving Approach**
1. **Understand the root cause** - Don't just fix symptoms
2. **Consider multiple solutions** - Present alternatives with trade-offs
3. **Think about edge cases** - What happens when things go wrong?
4. **Plan for testing** - How will we verify this works?
5. **Document decisions** - Why did we choose this approach?

### **Communication Style**
- **Be direct and honest** about limitations and risks
- **Explain technical trade-offs** in business terms when relevant
- **Propose concrete solutions** rather than abstract suggestions
- **Anticipate questions** and provide context for recommendations
- **Flag potential issues** before they become problems

## 🔧 **Technology Stack & Versions**

### **Frontend Framework**
- **Next.js:** `14.0.3` (App Router, current stable)
- **React:** `^18.2.0` 
- **TypeScript:** `^5.2.2` (Strict mode enabled)

### **Backend & Database**
- **Supabase:** `^2.38.4` (PostgreSQL + Auth + Real-time)
- **Database:** PostgreSQL with Row Level Security
- **Authentication:** Supabase Auth (Google OAuth + email/password)

### **Styling & UI**
- **Tailwind CSS:** `^3.3.5`
- **Icons:** Lucide React `^0.294.0`
- **Design System:** Custom gradient-based premium design

### **Deployment & Hosting**
- **Platform:** Vercel (Next.js optimized)
- **Node.js:** Latest LTS (as per Vercel default)
- **Build Target:** Static generation where possible

## 📋 **Coding Standards & Best Practices**

### **Next.js 14+ Patterns (REQUIRED)**
```javascript
// ✅ CORRECT - Next.js 14 metadata pattern
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
}

// ❌ WRONG - Old pattern (DO NOT USE)
export const metadata: Metadata = {
  viewport: { ... }, // This belongs in viewport export
  themeColor: '#3b82f6', // This belongs in viewport export
}
```

### **Component Architecture**
```javascript
// ✅ CORRECT - Stable components outside main component
const StableComponent = ({ props }) => { ... }

const MainComponent = () => {
  return (
    <>
      {condition && <StableComponent {...props} />}
    </>
  )
}

// ❌ WRONG - Components inside components (causes re-renders)
const MainComponent = () => {
  const InnerComponent = () => { ... } // DON'T DO THIS
  
  return <InnerComponent />
}
```

### **TypeScript Standards**
- **Strict mode:** Enabled (`"strict": true`)
- **No `any` types:** Use proper type unions instead
- **Interface definitions:** All props and state properly typed
- **Import types:** Use `import type` for type-only imports

### **File Organization**
```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx       # Root layout with metadata/viewport exports
│   └── page.tsx         # Home page
├── components/          # Reusable UI components
├── lib/                # Utilities, Supabase client, contexts
├── types/              # TypeScript interface definitions
└── styles/             # Global CSS (globals.css)

project-docs/
├── mockups/            # Interactive HTML prototypes and design artifacts
├── session-handoffs/   # Session continuation documents
└── [other-docs].md     # Project documentation
```

### **Mockups and Design Artifacts**

**All UI mockups, prototypes, and design artifacts MUST be saved in `project-docs/mockups/`**

**Mockup Standards:**
- **Format:** Interactive HTML files with CSS and JavaScript
- **Mobile-first:** 375px container width (iPhone standard)
- **Self-contained:** All styles and scripts inline (only cdnjs.cloudflare.com external)
- **Realistic data:** Use example data that reflects real use cases
- **Documentation:** Include notes explaining design decisions

**When to Create Mockups:**
- New UI components or features
- Design explorations and alternatives
- User flow prototypes
- Layout and interaction validation

**File Naming:**
- Use kebab-case: `feature-name-component.html`
- Include version if iterating: `dashboard-v2.html`
- Be descriptive: `goal-creation-form.html`

**Integration with Development:**
- Mockups serve as source of truth for UI implementation
- Include exact styling, spacing, and interaction patterns
- Reference mockups in session handoff documents
- Update mockups README.md with new additions

## 🎯 **Architecture Principles**

### **Component Design**
1. **Stable component identity** - No function components inside render functions
2. **Prop-based communication** - Pass data down, callbacks up
3. **Single responsibility** - Each component has one clear purpose
4. **Performance first** - useMemo/useCallback only when beneficial

### **State Management**
- **React Context:** For auth state and global data
- **Local state:** useState for component-specific data
- **Server state:** Supabase real-time subscriptions
- **NO Redux/Zustand:** Keep it simple with React built-ins

### **Error Handling**
```javascript
// ✅ CORRECT - Comprehensive error handling
try {
  const { data, error } = await supabaseCall()
  if (error) {
    console.error('Specific error:', error)
    setError(`Action failed: ${error.message}`)
    return
  }
  // Handle success
} catch (err) {
  console.error('Unexpected error:', err)
  setError(`Unexpected error: ${err.message}`)
}
```

## 📱 **Design & UX Standards**

### **Mobile-First Responsive**
- **Primary target:** Mobile (iOS Safari, Android Chrome)
- **Breakpoints:** Use Tailwind's default breakpoints
- **Touch targets:** Minimum 44px for interactive elements
- **Performance:** <3 second load time on 3G

### **Visual Design System**
```css
/* Primary Colors */
--blue-500: #3b82f6    /* Primary brand */
--purple-600: #9333ea  /* Secondary actions */
--green-500: #10b981   /* Success states */
--red-500: #ef4444     /* Error states */

/* Gradients */
--gradient-primary: from-blue-500 to-purple-600
--gradient-success: from-green-500 to-emerald-600
```

### **Interaction Patterns**
- **Loading states:** Always show loading spinners for async actions
- **Success feedback:** Immediate visual confirmation + auto-navigation
- **Error states:** Clear error messages with retry options
- **Input focus:** Maintain focus during typing (critical!)

## 🔒 **Security & Data Standards**

### **Environment Variables**
```bash
# REQUIRED - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OPTIONAL - App Configuration  
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### **Database Security**
- **Row Level Security:** ALWAYS enabled on all tables
- **User isolation:** Users can only access their own data
- **Auth policies:** Explicit policies for all operations
- **No direct DB access:** All access through Supabase client

### **Authentication**
- **Session duration:** 48 hours with activity reset
- **OAuth providers:** Google (primary), email/password (backup)
- **Email verification:** Required for email signups
- **Auto-logout:** Graceful session expiry handling

## 🧪 **Testing & Quality Standards**

### **Local Development**
```bash
# Required commands for development
npm run dev          # Development server
npm run build        # Production build test
npm run type-check   # TypeScript validation
npm run lint         # ESLint validation
```

### **Pre-commit Checklist**
- [ ] `npm run build` succeeds without errors
- [ ] `npm run type-check` passes
- [ ] Manual testing in Chrome + Safari mobile
- [ ] No console errors in browser
- [ ] All features work as expected

### **Production Deployment**
- **Platform:** Vercel with automatic deployments
- **Environment:** Production environment variables configured
- **Monitoring:** Manual testing post-deployment
- **Rollback:** Use Vercel deployment history if needed

## 🔄 **Development Workflow**

### **CRITICAL: Explicit Approval Protocol**
⚠️ **NEVER make code changes or update files without explicit user approval, even when troubleshooting bugs.**

**When user reports issues:**
1. **Analyze and explain** the problem
2. **Propose specific solution** with rationale
3. **Ask explicitly:** "Should I implement this fix?"
4. **Wait for confirmation** before making ANY changes
5. **Only proceed** after user says "Yes" or "Implement this"

**Examples of what requires approval:**
- Fixing bugs reported by user
- Updating configurations
- Installing dependencies
- Modifying existing code
- Creating new files
- ANY file system changes

**User may share screenshots, error messages, or describe problems - this is for discussion ONLY, not automatic implementation.**

### **Code Changes Protocol**
1. **Propose:** Present solution with rationale
2. **Approve:** Wait for explicit "Yes, implement this"
3. **Implement:** Code following these specifications
4. **Test locally:** Verify build + functionality
5. **Commit:** With descriptive commit messages
6. **Deploy:** Push to trigger Vercel deployment

### **Git Standards**
```bash
# Commit message format
"Fix critical input focus bug - restructure component architecture

- Move LogWorkoutView outside main component to prevent recreation
- Fixes duration input losing focus on keystroke
- Tested on iOS Safari, Android Chrome, desktop browsers

Ready for production deployment."
```

## ⚠️ **Critical Requirements**

### **Input Focus Bug Prevention**
- **NEVER** define function components inside other components
- **ALWAYS** use conditional rendering instead of function factories
- **TEST** multi-digit input immediately after component changes

### **Performance Requirements**
- **Bundle size:** <500KB total
- **Interaction response:** <100ms
- **Load time:** <3 seconds on 3G
- **Memory usage:** Stable (no memory leaks)

### **Browser Compatibility**
- **Primary:** iOS Safari, Android Chrome
- **Secondary:** Desktop Chrome, Firefox, Safari
- **Testing:** Always test mobile first

## 📚 **Reference Documentation**

### **Primary Sources**
- **Next.js 14 Docs:** https://nextjs.org/docs (App Router patterns)
- **React 18 Docs:** https://react.dev (Current patterns)
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Supabase Docs:** https://supabase.com/docs

### **Internal Documentation**
- **Best Practices:** `claude-collaboration-best-practices.md`
- **Project Status:** `project-status.md`
- **Implementation Plan:** `supabase-implementation-plan.md`
- **Session Handoffs:** `session-handoffs/` directory

## 🚀 **Upgrade Path**

### **When to Update Versions**
- **Next.js:** Only update for security fixes or critical features
- **React:** Follow Next.js compatibility requirements
- **Dependencies:** Update monthly for security patches
- **Node.js:** Follow Vercel platform updates

### **Breaking Change Protocol**
1. **Document reason** for breaking change
2. **Test thoroughly** in development
3. **Update this specification** document
4. **Communicate impact** to future sessions

## 🎯 **Success Metrics**

### **Code Quality**
- Zero TypeScript errors in production builds
- Zero console errors in browser
- All features work across target browsers
- Loading states and error handling complete

### **Performance**
- Lighthouse score >90 for Performance
- Core Web Vitals in "Good" range
- Mobile usability score >95
- No memory leaks or performance degradation

---

**This document should be the FIRST reference for any new development session.**

**When starting a new session:** Read this document BEFORE making any code changes to ensure you're following current standards and using the correct versions.

**When in doubt:** Refer to the specific version numbers and patterns documented here rather than assuming or using older patterns.
