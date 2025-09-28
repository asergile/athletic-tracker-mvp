# Pinned Items - Athletic Tracker MVP

**Items "pinned" for later discussion/implementation**

---

## 📌 **PIN #1: Navigation Accessibility Issue - Large Text/Display Scaling**
**Date:** September 27, 2025  
**Priority:** Medium-High (Accessibility)

### **Issue:**
When users increase font size or display scaling on mobile (common for glasses wearers), the rightmost "Profile" icon in StandardNavigation gets cut off/pushed off-screen on the main workout logging page.

### **Root Cause:**
- `StandardNavigation` uses fixed spacing (`flex space-x-2`) 
- Fixed padding (`p-3`) doesn't scale well with large text settings
- No responsive spacing adjustments for accessibility scenarios
- No overflow handling for constrained viewports

### **Proposed Solution:**
Make navigation responsive to large text settings:
- Use `space-x-1` (4px) on mobile, `space-x-2` (8px) on larger screens
- Reduce padding to `p-2` on mobile for large text scenarios  
- Add horizontal scroll fallback if needed
- Maintain current visual design but ensure all 5 icons always accessible

### **Files Affected:**
- `/src/components/StandardNavigation.tsx`

### **Impact:**
- **User Experience:** Critical for accessibility compliance
- **Technical Complexity:** Low - CSS responsive adjustments
- **Testing Required:** Large text/display scaling scenarios

### **Status:** 
🟡 **PINNED** - Ready for implementation when prioritized

---

*Use this file to track items that are "pinned" for later discussion. Add new pins above this line.*
