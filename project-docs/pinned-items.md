# Pinned Items - Athletic Tracker MVP

**Items "pinned" for later discussion/implementation**

---

## 📌 **PIN #2: Data Caching - Eliminate Page Flash on Navigation**
**Date:** September 30, 2025  
**Priority:** Medium (UX Enhancement)

### **Issue:**
When navigating between pages (Dashboard ↔ History ↔ Weekly View), there's a visible flash where metrics show 0 values before updating to actual data. This happens because each page refetches workout data from Supabase on every mount, creating a poor user experience.

**User Experience:**
- User logs workout on Dashboard
- Navigates to History page
- Sees metrics flash from 0 → actual values (~300ms delay)
- Navigates back to Dashboard
- Same flash happens again
- Data is being fetched multiple times unnecessarily

### **Root Cause:**
1. Each component (`AthleticTracker.tsx`, `history/page.tsx`, `WeeklyWorkoutView.tsx`) maintains its own local state
2. `useEffect` fires on every component mount
3. `loadUserData()` / `loadWorkouts()` fetches from Supabase each time
4. No shared cache between components
5. Network latency (~200-500ms) causes visible flash

**Current Flow:**
```
Mount Component → useEffect → Fetch Data → State Update → Re-render
   ↓
Empty array []   (shows 0s)     (async)     (triggers)    (shows data)
```

### **Proposed Solution:**
Implement React Context-based caching with smart invalidation:

**Architecture:**
```typescript
// 1. Create WorkoutDataContext
interface WorkoutCache {
  workouts: Workout[]
  userSettings: UserSettings
  customTypes: string[]
  lastFetch: Date | null
  isLoading: boolean
  refetch: () => Promise<void>
}

// 2. Cache Strategy
- Fetch on first mount only
- Persist data in context across page navigations
- Auto-refetch if cache is stale (> 5 minutes)
- Force refetch after mutations (create/update/delete workout)
- Show loading state only on initial fetch

// 3. Cache Invalidation
- After creating workout: refetch()
- After updating workout: refetch()
- After deleting workout: refetch()
- On app resume (visibility change): check staleness
```

**Implementation Steps:**
1. Create `/src/lib/WorkoutDataContext.tsx`
2. Implement cache logic with 5-minute TTL
3. Wrap app in provider at `_app.tsx` or root layout
4. Refactor 3 components to use context instead of local state:
   - `/src/components/AthleticTracker.tsx`
   - `/src/app/history/page.tsx`
   - `/src/components/WeeklyWorkoutView.tsx`
5. Add refetch calls after workout mutations

### **Benefits:**
- ✅ Instant page loads after initial fetch
- ✅ No more flashing 0 values
- ✅ Reduced Supabase API calls (better performance + lower costs)
- ✅ Better UX - smooth navigation
- ✅ No external dependencies needed

### **Trade-offs:**
- Data could be up to 5 minutes stale (acceptable for this use case)
- Adds one more context layer to app
- Cache cleared on full page refresh (acceptable - users rarely do this)
- Slightly more complex state management

### **Files Affected:**
- `/src/lib/WorkoutDataContext.tsx` (NEW)
- `/src/components/AthleticTracker.tsx` (refactor to use context)
- `/src/app/history/page.tsx` (refactor to use context)
- `/src/components/WeeklyWorkoutView.tsx` (refactor to use context)
- `/src/app/layout.tsx` or similar (add provider)

### **Alternative Considered:**
React Query or SWR library - but adds external dependency and more setup overhead. Context-based solution is simpler and sufficient for this app's needs.

### **Impact:**
- **User Experience:** High - eliminates annoying flash, instant navigation
- **Technical Complexity:** Medium - requires context setup and refactoring 3 components
- **Testing Required:** Navigation flows, cache invalidation after mutations, stale data handling
- **Estimated Time:** 20-30 minutes implementation

### **Status:** 
🟡 **PINNED** - Ready for implementation when prioritized

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
