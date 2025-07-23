# Mockups Directory

This directory contains interactive HTML mockups for the Athletic Tracker MVP project.

## Purpose

All UI mockups, prototypes, and design artifacts should be saved here for:
- Reference by future Claude sessions
- Design consistency across development
- Visual validation with stakeholders
- Documentation of UX decisions

## Current Mockups

### Event Banking System
- **`event-banking-dashboard.html`** - Main banking dashboard with Option 3 design (compact dual display)
- **`goal-creation-form.html`** - Goal creation form with live preview

## Design Standards

### Mockup Requirements
- **Interactive:** Include JavaScript for user interactions
- **Mobile-first:** 375px container width (iPhone standard)
- **Design system:** Use app's gradient colors and Tailwind-inspired styling
- **Realistic data:** Use example data that reflects real use cases
- **Documentation:** Include notes explaining design decisions

### Naming Convention
- Use kebab-case for file names
- Include component or feature name
- Add version number if iterating (e.g., `dashboard-v2.html`)

### Integration with Development
- Mockups should demonstrate exact UI patterns for implementation
- Include correct data structures and API responses
- Show all interaction states (loading, error, success)
- Match current app's design tokens and typography

## Working Pattern for Future Sessions

**When creating mockups:**
1. Save all interactive prototypes as HTML files in this directory
2. Reference mockups in session handoff documents
3. Update this README with new mockup descriptions
4. Ensure mockups use realistic data and interactions

**For developers:**
- Use mockups as source of truth for UI implementation
- Match styling, spacing, and interactions exactly
- Test against mockup behavior before deployment

**For stakeholders:**
- Open HTML files in browser to interact with prototypes
- Provide feedback on specific interaction patterns
- Validate user flows before development begins

## Technical Notes

- **External Dependencies:** Only cdnjs.cloudflare.com allowed for external scripts
- **Icons:** Lucide React icons via CDN
- **Styling:** Inline CSS for self-contained files
- **Responsive:** Mobile-first with touch-friendly interactions
- **Accessibility:** Proper contrast and semantic HTML

## File Structure
```
mockups/
├── README.md                          # This file
├── event-banking-dashboard.html       # Banking card cycling and progress
├── goal-creation-form.html            # Goal creation with live preview
└── [future-mockups].html              # Additional prototypes
```

---

**Note:** This directory was established as a working pattern for the Athletic Tracker MVP project. All future mockups and design artifacts should follow this structure for consistency and accessibility across Claude sessions.