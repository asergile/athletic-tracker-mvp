# Onboarding Flow Implementation Plan

**Project:** Athletic Tracker MVP (Goal Buddy)  
**Feature:** First-Time User Onboarding Experience  
**Created:** October 8, 2025  
**Last Updated:** October 8, 2025  
**Status:** Segments 1 & 2 Complete - Segment 4 Next

---

## 🏗️ **Project Architecture**

**Framework:** Next.js 14 with App Router  
**Language:** TypeScript exclusively (`.tsx` for components, `.ts` for utilities)  
**Routing:** Next.js file-based routing in `/src/app/`  
**Important:** All JavaScript files (`.js`, `.jsx`) are backups only - DO NOT USE

**Navigation Imports:**
```typescript
import { useRouter } from 'next/navigation'  // Next.js 14 App Router
import Link from 'next/link'                  // Next.js Link component
```

---

## 🎯 **Project Overview**

**Goal:** Create a dedicated onboarding flow for new users that:
- Introduces Goal Buddy's value proposition (3-screen carousel)
- Guides users to create their first goal (simplified form)
- Marks onboarding complete and redirects to main app
- NEVER shows again after completion

**Key Principle:** Onboarding is a separate, one-time experience. Existing app pages remain completely unchanged.

---

## ⚠️ **CRITICAL: TypeScript Only Development**

**DO NOT USE JavaScript files:**
- All `.js` and `.jsx` files in the project are BACKUPS ONLY
- Found at: `App.js.backup`, `index.js.backup`, `index.css.backup`
- Use ONLY `.ts` and `.tsx` files for development
- All new code must be TypeScript with proper type definitions

**TypeScript Standards:**
- Strict mode enabled
- No `any` types - use proper type unions
- All interfaces properly defined
- Import types: `import type { Metadata } from 'next'`

---

## 📋 **Work Segments (Phases)**

### **✅ Completion Tracking**
- [x] Segment 1: Database Schema & Helpers (COMPLETE - Oct 8, 2025)
- [x] Segment 2: Onboarding Screens Page (COMPLETE - Oct 8, 2025)
- [ ] Segment 3: First Goal Creation Page
- [ ] Segment 4: Flow Control & Routing Logic (NEXT PRIORITY)
- [ ] Segment 5: Testing & Polish

**Each segment can be completed independently across chat sessions.**

---

## 🔧 **SEGMENT 1: Database Schema & Helpers**

**Priority:** HIGH (Must complete first - prerequisite for all other segments)  
**Estimated Time:** 15-20 minutes  
**Token Cost:** LOW (~5k tokens)

### **What This Does:**
- Adds `onboarding_completed` boolean field to database
- Creates helper function to mark onboarding complete
- Establishes data foundation for flow control

### **Files to Modify:**
1. Database schema (Supabase SQL migration)
2. `/src/lib/security/enhanced-db-helpers.ts`

### **Detailed Steps:**

#### **Step 1.1: Database Migration**
Run this SQL in Supabase SQL Editor:

```sql
-- Add onboarding_completed column to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set existing users to completed (they already know the app)
UPDATE user_settings 
SET onboarding_completed = TRUE 
WHERE onboarding_completed IS NULL;

-- Add index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding 
ON user_settings(onboarding_completed);
```

**Validation:**
- Query user_settings table to confirm column exists
- Check that existing users have `onboarding_completed = true`
- New users should default to `false`

---

#### **Step 1.2: Add Helper Function**

**File:** `/src/lib/security/enhanced-db-helpers.ts`

**Add this function to the `dbHelpers` object:**

```typescript
/**
 * Mark user's onboarding as completed
 * Called after user completes onboarding flow or clicks skip
 */
markOnboardingComplete: async (): Promise<{
  data: boolean | null;
  error: PostgrestError | null;
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { 
        data: null, 
        error: { 
          message: 'User not authenticated', 
          details: '', 
          hint: '', 
          code: 'AUTH_ERROR' 
        } as PostgrestError 
      };
    }

    const { data, error } = await supabase
      .from('user_settings')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id)
      .select('onboarding_completed')
      .single();

    if (error) {
      console.error('Error marking onboarding complete:', error);
      return { data: null, error };
    }

    return { data: data?.onboarding_completed ?? true, error: null };
  } catch (err) {
    console.error('Unexpected error in markOnboardingComplete:', err);
    return { 
      data: null, 
      error: { 
        message: err instanceof Error ? err.message : 'Unknown error',
        details: '',
        hint: '',
        code: 'UNKNOWN_ERROR'
      } as PostgrestError
    };
  }
},
```

**Location in file:** Add near other user settings functions (around line 400-500, with `getUserSettings`, `updateUserSettings`, etc.)

**Testing Step 1.2:**
```typescript
// Test in browser console after implementing:
const result = await dbHelpers.markOnboardingComplete();
console.log('Onboarding marked complete:', result);
// Then query user_settings to confirm flag is true
```

---

#### **Step 1.3: Update UserSettings Type**

**File:** `/src/types/index.ts` (or wherever UserSettings interface is defined)

**Add field to interface:**
```typescript
interface UserSettings {
  // ... existing fields
  onboarding_completed?: boolean; // Add this line
}
```

**Location:** Search for `interface UserSettings` or similar type definition

---

### **Segment 1 Completion Criteria:**
- ✅ Database column exists with default value `false`
- ✅ Existing users have `onboarding_completed = true`
- ✅ Helper function `markOnboardingComplete()` works correctly
- ✅ TypeScript types updated (no build errors)
- ✅ Test: Can manually call helper and see flag change in database

### **Files Modified in Segment 1:**
- Database schema (Supabase)
- `/src/lib/security/enhanced-db-helpers.ts`
- `/src/types/index.ts` (or similar)

### **Git Commit Message:**
```
feat(onboarding): Add database schema and helpers for onboarding flow

- Add onboarding_completed boolean to user_settings table
- Set existing users to completed (they already know the app)
- Add markOnboardingComplete() helper function
- Update UserSettings TypeScript interface

Part 1/5 of onboarding implementation
```

---

## 🎨 **SEGMENT 2: Onboarding Screens Page**

**Priority:** MEDIUM (Can do after Segment 1)  
**Estimated Time:** 30-40 minutes  
**Token Cost:** MEDIUM (~15k tokens)

### **What This Does:**
- Creates the 3-screen onboarding carousel
- Converts HTML wireframe to Next.js component
- Handles screen transitions and navigation
- Routes to goal creation or dashboard

### **Files to Create:**
1. `/src/app/onboarding/page.tsx` (NEW - TypeScript React component)
2. `/src/app/onboarding/layout.tsx` (NEW - Next.js layout component)

### **Dependencies:**
- Requires Segment 1 complete (database helpers available)
- Can be built and tested independently before flow control

---

#### **Step 2.1: Create Onboarding Layout**

**File:** `/src/app/onboarding/layout.tsx` (NEW)

**Purpose:** Minimal layout without bottom navigation (clean onboarding experience)

**Note:** This is a Next.js App Router layout component - TypeScript only.

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome - Goal Buddy',
  description: 'Get started with Goal Buddy',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
```

**Testing:** Create this file, verify no build errors, visit `/onboarding` (will be blank until Step 2.2)

---

#### **Step 2.2: Create Onboarding Screens Component**

**File:** `/src/app/onboarding/page.tsx` (NEW)

**Architecture:** Next.js 14 App Router page component (TypeScript)  
**Reference Source:** `/design-wireframes/onboarding-with-logo.html`

**Key Requirements:**
- 3 screens with smooth transitions
- Screen 1: Welcome with PB logo + "Goal Buddy" + tagline
- Screen 2: "Set Your Goals" with animated sports icons
- Screen 3: "Log & Track Workouts" 
- Progress dots at bottom
- "Next" / "Skip" / "Create My First Goal" buttons
- Mobile-first responsive design

**Component Structure:**

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'

export default function OnboardingPage(): React.ReactElement {
  const router = useRouter()
  const [currentScreen, setCurrentScreen] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Screen navigation
  const nextScreen = () => {
    if (currentScreen < 3) {
      setCurrentScreen(currentScreen + 1)
    }
  }

  const skipToEnd = () => {
    setCurrentScreen(3)
  }

  // Handle "Create My First Goal" button
  const handleCreateGoal = () => {
    router.push('/onboarding/create-goal')
  }

  // Handle "Skip" - mark complete and go to dashboard
  const handleSkip = async () => {
    setIsLoading(true)
    try {
      await dbHelpers.markOnboardingComplete()
      router.push('/')
    } catch (error) {
      console.error('Error skipping onboarding:', error)
      // Still redirect even if flag update fails
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {/* Phone Frame Container */}
      <div className="w-full max-w-[375px] h-[667px] bg-white rounded-[30px] shadow-2xl overflow-hidden relative">
        
        {/* Screen 1: Welcome */}
        {currentScreen === 1 && (
          <Screen1 
            onNext={nextScreen} 
            onSkip={handleSkip}
            isLoading={isLoading}
          />
        )}

        {/* Screen 2: Set Goals */}
        {currentScreen === 2 && (
          <Screen2 
            onNext={nextScreen} 
            onSkip={skipToEnd}
          />
        )}

        {/* Screen 3: Track Progress */}
        {currentScreen === 3 && (
          <Screen3 
            onCreateGoal={handleCreateGoal} 
            onSkip={handleSkip}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}

// Individual Screen Components
const Screen1 = ({ onNext, onSkip, isLoading }: {
  onNext: () => void
  onSkip: () => void
  isLoading: boolean
}) => (
  <div className="h-full flex flex-col justify-between p-8 bg-gradient-to-br from-blue-900 to-green-500">
    <div className="flex-1 flex flex-col justify-center items-center text-center">
      <div className="w-[120px] h-[120px] mb-8">
        <Image
          src="/images/Logo PB white.png"
          alt="Goal Buddy Logo"
          width={120}
          height={120}
          className="object-contain"
        />
      </div>
      <h1 className="text-[26px] font-bold text-white mb-4">Goal Buddy</h1>
      <p className="text-white text-opacity-95 text-base leading-relaxed max-w-[300px]">
        Welcome to your personal athletic goal setting and training tracker. Stay consistent and smash your goals.
      </p>
    </div>

    <div className="space-y-4">
      <ProgressDots current={1} total={3} />
      <button
        onClick={onNext}
        className="w-full py-4 rounded-xl bg-white text-blue-900 font-semibold text-lg hover:shadow-lg transition-all duration-200"
      >
        Get Started
      </button>
      <button
        onClick={onSkip}
        disabled={isLoading}
        className="w-full py-4 rounded-xl bg-transparent border-2 border-white border-opacity-50 text-white font-semibold text-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
      >
        {isLoading ? 'Loading...' : 'I Already Have An Account'}
      </button>
    </div>
  </div>
)

const Screen2 = ({ onNext, onSkip }: {
  onNext: () => void
  onSkip: () => void
}) => {
  const [currentIcon, setCurrentIcon] = useState('🏊‍♂️')
  const sportsIcons = ['🏊‍♂️', '🏃‍♂️', '🚴‍♂️', '🎾', '⚽', '🏋️‍♂️', '🏀', '⛷️']
  const [iconIndex, setIconIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % sportsIcons.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setCurrentIcon(sportsIcons[iconIndex])
  }, [iconIndex])

  return (
    <div className="h-full flex flex-col justify-between p-8 bg-gradient-to-br from-purple-400 to-pink-500">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="w-[120px] h-[120px] mb-8 bg-white bg-opacity-20 border-3 border-white border-opacity-50 rounded-full flex items-center justify-center text-6xl transition-opacity duration-300">
          {currentIcon}
        </div>
        <h1 className="text-[28px] font-bold text-white mb-4">Set Your Goals</h1>
        <p className="text-white text-opacity-90 text-base leading-relaxed max-w-[300px]">
          Create events and set specific goals for your competitions. Track countdown to race day and watch your progress build.
        </p>
      </div>

      <div className="space-y-4">
        <ProgressDots current={2} total={3} />
        <button
          onClick={onNext}
          className="w-full py-4 rounded-xl bg-white text-purple-900 font-semibold text-lg hover:shadow-lg transition-all duration-200"
        >
          Next
        </button>
        <button
          onClick={onSkip}
          className="w-full py-4 rounded-xl bg-transparent border-2 border-white border-opacity-50 text-white font-semibold text-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
        >
          Skip
        </button>
      </div>
    </div>
  )
}

const Screen3 = ({ onCreateGoal, onSkip, isLoading }: {
  onCreateGoal: () => void
  onSkip: () => void
  isLoading: boolean
}) => (
  <div className="h-full flex flex-col justify-between p-8 bg-gradient-to-br from-blue-400 to-cyan-400">
    <div className="flex-1 flex flex-col justify-center items-center text-center">
      <div className="w-[120px] h-[120px] mb-8 bg-white bg-opacity-20 border-3 border-white border-opacity-50 rounded-full flex items-center justify-center text-6xl">
        🏆
      </div>
      <h1 className="text-[28px] font-bold text-white mb-4">Log & Track Workouts</h1>
      <p className="text-white text-opacity-90 text-base leading-relaxed max-w-[300px]">
        Quickly log every workout and bank hours toward your goals. See your training add up and stay motivated until race day.
      </p>
    </div>

    <div className="space-y-4">
      <ProgressDots current={3} total={3} />
      <button
        onClick={onCreateGoal}
        className="w-full py-4 rounded-xl bg-white text-blue-900 font-semibold text-lg hover:shadow-lg transition-all duration-200"
      >
        Create My First Goal
      </button>
      <button
        onClick={onSkip}
        disabled={isLoading}
        className="w-full py-4 rounded-xl bg-transparent border-2 border-white border-opacity-50 text-white font-semibold text-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
      >
        {isLoading ? 'Loading...' : 'Skip'}
      </button>
    </div>
  </div>
)

const ProgressDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex justify-center gap-2 mb-5">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className={`h-2 rounded-full transition-all duration-300 ${
          i + 1 === current
            ? 'w-6 bg-white'
            : 'w-2 bg-white bg-opacity-40'
        }`}
      />
    ))}
  </div>
)
```

**Implementation Notes:**
- Component structure follows existing patterns in the app
- Uses Tailwind gradients matching wireframe designs
- Implements smooth screen transitions
- Handles loading states
- Mobile-first with max-width container

---

### **Segment 2 Completion Criteria:**
- ✅ `/onboarding` route displays all 3 screens correctly
- ✅ Screen transitions work smoothly
- ✅ Progress dots update correctly
- ✅ "Get Started" / "Next" buttons advance screens
- ✅ "Skip" button calls `markOnboardingComplete()` and redirects to dashboard
- ✅ "Create My First Goal" button navigates to `/onboarding/create-goal`
- ✅ Sports icons animate on Screen 2
- ✅ Responsive design works on mobile and desktop
- ✅ No TypeScript errors

### **Testing Segment 2:**
1. Visit `/onboarding` in browser
2. Click through all 3 screens - verify transitions
3. Test "Skip" button - should redirect to dashboard and set flag
4. Test "Create My First Goal" - should navigate to create-goal page (will 404 until Segment 3)
5. Verify mobile responsive design

### **Files Created in Segment 2:**
- `/src/app/onboarding/page.tsx` (NEW)
- `/src/app/onboarding/layout.tsx` (NEW)

### **Git Commit Message:**
```
feat(onboarding): Add 3-screen onboarding carousel

- Create /onboarding route with welcome screens
- Implement screen transitions with progress dots
- Add PB logo and brand gradients
- Handle skip and next navigation
- Mobile-first responsive design

Part 2/5 of onboarding implementation
```

---

## 🎯 **SEGMENT 3: First Goal Creation Page**

**Priority:** MEDIUM (Can do after Segments 1 & 2)  
**Estimated Time:** 40-50 minutes  
**Token Cost:** MEDIUM-HIGH (~20k tokens)

### **What This Does:**
- Creates simplified goal creation form for new users
- Combines event + goal creation in single flow
- Auto-calculates suggested workout target
- Marks onboarding complete after submission
- Redirects to dashboard with success message

### **Files to Create:**
1. `/src/app/onboarding/create-goal/page.tsx` (NEW - Next.js page component, TypeScript)

### **Dependencies:**
- Requires Segment 1 complete (database helpers)
- Works best with Segment 2 (onboarding screens) but can be built independently

---

#### **Step 3.1: Create First Goal Creation Page**

**File:** `/src/app/onboarding/create-goal/page.tsx` (NEW)

**Architecture:** Next.js 14 App Router page component (TypeScript)  
**Design Philosophy:**
- Simplified single-form approach (not separate event + goal steps)
- Encouraging copy throughout
- Auto-calculate recommended workouts
- Show calculation logic to user
- Immediate feedback and success state

**Component Structure:**

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'
import { Calendar, Target, TrendingUp } from 'lucide-react'

export default function CreateFirstGoalPage(): React.ReactElement {
  const router = useRouter()
  const { user } = useAuth()

  // Form state
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [targetWorkouts, setTargetWorkouts] = useState<number | ''>('')
  const [suggestedWorkouts, setSuggestedWorkouts] = useState(0)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // User settings for calculation
  const [weeklyFrequency, setWeeklyFrequency] = useState(4)

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await dbHelpers.getUserSettings()
      if (data?.weekly_workout_frequency) {
        setWeeklyFrequency(data.weekly_workout_frequency)
      }
    }
    loadSettings()
  }, [])

  // Auto-calculate suggested workouts when date changes
  useEffect(() => {
    if (eventDate) {
      const today = new Date()
      const event = new Date(eventDate)
      const weeksRemaining = Math.max(0.1, (event.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const suggested = Math.ceil(weeksRemaining * weeklyFrequency)
      setSuggestedWorkouts(suggested)
      
      // Auto-fill target if not manually set
      if (!targetWorkouts) {
        setTargetWorkouts(suggested)
      }
    }
  }, [eventDate, weeklyFrequency])

  // Form validation
  const isValid = eventName.trim() !== '' && eventDate !== '' && targetWorkouts && targetWorkouts > 0

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid || !user) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Step 1: Create the event
      const eventResponse = await dbHelpers.createEvent({
        name: eventName,
        eventDate: eventDate,
        goal: goalDescription || undefined
      })

      if (eventResponse.error) {
        throw new Error(eventResponse.error.message)
      }

      const eventId = eventResponse.data?.id
      if (!eventId) {
        throw new Error('Event created but no ID returned')
      }

      // Step 2: Create the goal
      const goalResponse = await dbHelpers.createGoal(eventId, Number(targetWorkouts))

      if (goalResponse.error) {
        throw new Error(goalResponse.error.message)
      }

      // Step 3: Mark onboarding complete
      await dbHelpers.markOnboardingComplete()

      // Step 4: Show success and redirect
      setShowSuccess(true)
      
      // Redirect after brief celebration
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (err) {
      console.error('Error creating first goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to create goal. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 p-6">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-4">Goal Created!</h1>
          <p className="text-xl text-white text-opacity-90">
            Let's start logging workouts and crushing that goal!
          </p>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-green-500 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Create Your First Goal
          </h1>
          <p className="text-white text-opacity-90 text-lg">
            Set a target event and we'll help you stay on track
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-300 rounded-xl">
            <p className="text-white text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-5">
            <label className="flex items-center text-white font-semibold mb-3">
              <Calendar className="w-5 h-5 mr-2" />
              What event are you training for?
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Boston Marathon, Spring Triathlon"
              className="w-full p-4 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:outline-none text-lg"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Event Date */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-5">
            <label className="flex items-center text-white font-semibold mb-3">
              <Calendar className="w-5 h-5 mr-2" />
              When is your event?
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-4 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-green-400 focus:outline-none text-lg"
              disabled={isSubmitting}
            />
            {eventDate && (
              <p className="text-white text-opacity-80 text-sm mt-2">
                📅 {Math.ceil((new Date(eventDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))} days until your event
              </p>
            )}
          </div>

          {/* Goal Description (Optional) */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-5">
            <label className="flex items-center text-white font-semibold mb-3">
              <Target className="w-5 h-5 mr-2" />
              What's your goal? (Optional)
            </label>
            <input
              type="text"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="e.g., Finish under 4 hours, Complete the distance"
              className="w-full p-4 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:outline-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          {/* Target Workouts */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-5">
            <label className="flex items-center text-white font-semibold mb-3">
              <TrendingUp className="w-5 h-5 mr-2" />
              How many workouts until race day?
            </label>
            <input
              type="number"
              value={targetWorkouts}
              onChange={(e) => setTargetWorkouts(e.target.value ? parseInt(e.target.value) : '')}
              min="1"
              max="365"
              placeholder={suggestedWorkouts.toString()}
              className="w-full p-4 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:outline-none text-lg"
              disabled={isSubmitting}
            />
            {eventDate && suggestedWorkouts > 0 && (
              <div className="mt-3 p-3 bg-white bg-opacity-20 rounded-lg">
                <p className="text-white text-sm">
                  💡 <strong>We recommend {suggestedWorkouts} workouts</strong> based on your training schedule ({weeklyFrequency}x per week)
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full py-5 rounded-xl font-bold text-xl transition-all duration-200 ${
              !isValid || isSubmitting
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-white text-blue-900 hover:shadow-2xl hover:scale-105 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Your Goal...
              </span>
            ) : (
              '🎯 Create My Goal'
            )}
          </button>

          {/* Skip Option */}
          <button
            type="button"
            onClick={async () => {
              await dbHelpers.markOnboardingComplete()
              router.push('/')
            }}
            disabled={isSubmitting}
            className="w-full py-4 text-white text-opacity-80 hover:text-opacity-100 font-medium transition-opacity"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Implementation Notes:**
- Single-page form with all fields
- Auto-calculates suggested workouts based on event date and weekly frequency
- Validates all inputs before submission
- Creates event → creates goal → marks onboarding complete → redirects
- Success celebration screen before redirect
- Option to skip and create goals later

---

### **Segment 3 Completion Criteria:**
- ✅ `/onboarding/create-goal` route displays form correctly
- ✅ Auto-calculation of suggested workouts works
- ✅ Form validation prevents invalid submissions
- ✅ Successfully creates event and goal in database
- ✅ Marks `onboarding_completed = true` after submission
- ✅ Shows success celebration screen
- ✅ Redirects to dashboard after 2 seconds
- ✅ "Skip" button works and redirects to dashboard
- ✅ No TypeScript errors
- ✅ Responsive design works on mobile

### **Testing Segment 3:**
1. Navigate from `/onboarding` screen 3 to create-goal page
2. Fill out form - verify auto-calculation works
3. Submit form - verify event and goal created in database
4. Verify `onboarding_completed` flag set to true
5. Verify success celebration shows
6. Verify redirect to dashboard after 2 seconds
7. Test "Skip" button - should mark complete and redirect
8. Test validation - submit with empty fields should be blocked

### **Files Created in Segment 3:**
- `/src/app/onboarding/create-goal/page.tsx` (NEW)

### **Git Commit Message:**
```
feat(onboarding): Add first goal creation page

- Create /onboarding/create-goal route
- Simplified single-form goal creation for new users
- Auto-calculate suggested workout targets
- Success celebration and redirect to dashboard
- Mark onboarding complete after goal creation

Part 3/5 of onboarding implementation
```

---

## 🔄 **SEGMENT 4: Flow Control & Routing Logic**

**Priority:** HIGH (Required to activate onboarding flow)  
**Estimated Time:** 20-30 minutes  
**Token Cost:** MEDIUM (~10k tokens)

### **What This Does:**
- Adds redirect logic to check onboarding status
- Routes new users to `/onboarding` automatically
- Prevents completed users from accessing `/onboarding` again
- Handles auth loading states properly

### **Files to Modify:**
1. `/src/app/layout.tsx` (UPDATE - Next.js root layout, TypeScript)
2. `/src/lib/AuthContext.tsx` (MINOR UPDATE - add onboarding_completed to user settings)

### **Dependencies:**
- Requires ALL previous segments complete (Segments 1, 2, 3)
- This segment "activates" the onboarding flow

---

#### **Step 4.1: Update AuthContext to Include Onboarding Status**

**File:** `/src/lib/AuthContext.tsx`

**Change:** Ensure `onboarding_completed` is loaded with user settings

**Find the section where user settings are loaded (likely in `useEffect` or initialization):**

```typescript
// Existing code loads user settings...
const { data: settings } = await dbHelpers.getUserSettings()

// Ensure onboarding_completed is included
// This should already work if getUserSettings returns all fields
// No code change needed if getUserSettings already returns full settings object
```

**Validation:** Check that `userSettings` state includes `onboarding_completed` field.

---

#### **Step 4.2: Add Onboarding Redirect Logic to Root Layout**

**File:** `/src/app/layout.tsx`

**Add redirect logic after auth loads:**

**Important:** This is the Next.js 14 App Router root layout - TypeScript only.

**Find the existing layout component. Add this logic:**

```typescript
'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'  // Next.js 14 App Router
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, isHydrated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  // Check onboarding status when user loads
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || !isHydrated) {
        setCheckingOnboarding(false)
        return
      }

      try {
        const { data: settings } = await dbHelpers.getUserSettings()
        const completed = settings?.onboarding_completed ?? true // Default true for safety
        setOnboardingStatus(completed)

        // Redirect logic
        const isOnboardingRoute = pathname.startsWith('/onboarding')

        if (!completed && !isOnboardingRoute) {
          // New user not on onboarding → redirect to onboarding
          router.push('/onboarding')
        } else if (completed && isOnboardingRoute) {
          // Completed user trying to access onboarding → redirect to dashboard
          router.push('/')
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // On error, assume completed to avoid redirect loops
        setOnboardingStatus(true)
      } finally {
        setCheckingOnboarding(false)
      }
    }

    checkOnboarding()
  }, [user, isHydrated, pathname, router])

  // Show loading during auth or onboarding check
  if (loading || !isHydrated || (user && checkingOnboarding)) {
    return (
      <html lang="en">
        <body>
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading...</p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
```

**Alternative Simpler Approach (if above is too complex for existing structure):**

Add a separate `OnboardingCheck` component and include it in layout:

```typescript
// Add new component file: /src/components/OnboardingCheck.tsx
// TypeScript React component for Next.js 14 App Router
'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'

export default function OnboardingCheck() {
  const { user, isHydrated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || !isHydrated || checked) return

      try {
        const { data: settings } = await dbHelpers.getUserSettings()
        const completed = settings?.onboarding_completed ?? true

        const isOnboardingRoute = pathname.startsWith('/onboarding')

        if (!completed && !isOnboardingRoute) {
          router.push('/onboarding')
        } else if (completed && isOnboardingRoute) {
          router.push('/')
        }

        setChecked(true)
      } catch (error) {
        console.error('Error checking onboarding:', error)
        setChecked(true)
      }
    }

    checkOnboarding()
  }, [user, isHydrated, pathname, router, checked])

  return null // This component only handles routing
}
```

Then add to layout:

```typescript
// In /src/app/layout.tsx (Next.js 14 root layout)
import OnboardingCheck from '@/components/OnboardingCheck'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <OnboardingCheck />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Choose the approach that fits better with existing architecture.**

---

### **Segment 4 Completion Criteria:**
- ✅ New users automatically redirected to `/onboarding` on first login
- ✅ After completing onboarding, users redirected to dashboard
- ✅ Existing users (onboarding_completed = true) never see onboarding
- ✅ Direct URL access to `/onboarding` when completed redirects to dashboard
- ✅ No redirect loops or infinite loading states
- ✅ Loading states handled gracefully
- ✅ No TypeScript errors

### **Testing Segment 4:**

**Test New User Flow:**
1. Create fresh test account
2. After signup/login, should redirect to `/onboarding`
3. Complete onboarding flow
4. Should redirect to dashboard
5. Try accessing `/onboarding` again → should redirect to dashboard

**Test Existing User Flow:**
1. Login with account that has `onboarding_completed = true`
2. Should go directly to dashboard
3. Try accessing `/onboarding` via URL → should redirect to dashboard

**Test Skip Flow:**
1. Create fresh account
2. Click "Skip" on onboarding screen
3. Should mark complete and redirect to dashboard
4. Try accessing `/onboarding` again → should redirect to dashboard

### **Files Modified in Segment 4:**
- `/src/app/layout.tsx` (UPDATE)
- `/src/components/OnboardingCheck.tsx` (NEW - if using simpler approach)

### **Git Commit Message:**
```
feat(onboarding): Add flow control and routing logic

- Redirect new users to /onboarding automatically
- Prevent completed users from accessing onboarding again
- Handle loading states during onboarding check
- Add OnboardingCheck component for clean routing logic

Part 4/5 of onboarding implementation
```

---

## ✨ **SEGMENT 5: Testing, Polish & Documentation**

**Priority:** MEDIUM (Final polish after core functionality works)  
**Estimated Time:** 20-30 minutes  
**Token Cost:** LOW (~5k tokens)

### **What This Does:**
- Comprehensive end-to-end testing
- Fix any edge cases or bugs
- Polish animations and transitions
- Update documentation
- Prepare for production

### **Testing Checklist:**

#### **New User Happy Path:**
- [ ] Sign up for new account
- [ ] Automatically redirected to `/onboarding`
- [ ] See all 3 onboarding screens
- [ ] Click "Next" through screens - smooth transitions
- [ ] Progress dots update correctly
- [ ] Click "Create My First Goal" on screen 3
- [ ] Fill out goal creation form
- [ ] Auto-calculation shows suggested workouts
- [ ] Submit form successfully
- [ ] See success celebration
- [ ] Redirected to dashboard after 2 seconds
- [ ] Goal visible on dashboard and `/goals` page
- [ ] Try accessing `/onboarding` again - should redirect to dashboard

#### **Skip Flow:**
- [ ] Sign up for new account
- [ ] Click "Skip" or "I Already Have An Account" on any onboarding screen
- [ ] Redirected to dashboard immediately
- [ ] No goal created (expected)
- [ ] Can create goals normally via `/goals` page
- [ ] Try accessing `/onboarding` again - should redirect to dashboard

#### **Existing User Flow:**
- [ ] Login with existing account (onboarding_completed = true)
- [ ] Should NOT see onboarding
- [ ] Goes directly to dashboard
- [ ] Try accessing `/onboarding` via URL - should redirect to dashboard
- [ ] App functions normally

#### **Edge Cases:**
- [ ] Back button during onboarding - should work normally
- [ ] Refresh page during onboarding - should stay on onboarding
- [ ] Refresh during goal creation - should stay on goal creation
- [ ] Network error during goal creation - shows error message
- [ ] Invalid form inputs - validation prevents submission
- [ ] Very long event names - text wraps properly
- [ ] Far future dates - calculation works correctly
- [ ] Mobile viewport - responsive design works
- [ ] Tablet viewport - responsive design works
- [ ] Desktop viewport - responsive design works

#### **Performance:**
- [ ] No console errors
- [ ] No TypeScript build errors
- [ ] Fast page transitions (<200ms)
- [ ] No flickering or layout shifts
- [ ] Smooth animations
- [ ] Database queries efficient

---

### **Polish Items:**

**Visual Polish:**
- [ ] Check icon sizing consistency across all screens
- [ ] Verify gradient colors match brand
- [ ] Ensure button hover states feel responsive
- [ ] Check text readability on all gradient backgrounds
- [ ] Verify spacing and padding consistency
- [ ] Check mobile tap target sizes (min 44px)

**UX Polish:**
- [ ] Add smooth fade transitions between screens
- [ ] Consider adding haptic feedback (vibration) on mobile
- [ ] Ensure focus states work for keyboard navigation
- [ ] Add loading spinners where appropriate
- [ ] Clear error messages with actionable guidance

**Copy Polish:**
- [ ] Review all button text for clarity
- [ ] Ensure encouraging, positive tone throughout
- [ ] Check for typos or grammatical errors
- [ ] Verify calculation explanation is clear

---

### **Documentation Updates:**

**Update these files:**

1. **`/project-docs/project-status.md`**
   - Mark onboarding implementation as COMPLETE
   - Document new routes
   - Add to feature list

2. **`/project-docs/file-structure-reference.md`**
   - Add `/onboarding` routes
   - Add `/onboarding/create-goal` route
   - Document OnboardingCheck component

3. **`README.md`** (if it exists)
   - Mention onboarding flow
   - Update feature list

4. **Create `/project-docs/onboarding-guide.md`** (NEW)
   - User flow documentation
   - Technical implementation notes
   - Testing procedures
   - Future enhancement ideas

---

### **Known Issues / Future Enhancements:**

Document any issues or ideas for future:
- [ ] Add analytics tracking for onboarding completion rate
- [ ] A/B test different copy variations
- [ ] Add user preferences collection during onboarding
- [ ] Consider video or animation on welcome screen
- [ ] Multi-language support for onboarding
- [ ] Accessibility audit and improvements

---

### **Segment 5 Completion Criteria:**
- ✅ All testing checklist items pass
- ✅ No console errors in any flow
- ✅ No TypeScript build errors
- ✅ Visual polish complete
- ✅ Documentation updated
- ✅ Known issues documented

### **Files Modified in Segment 5:**
- `/project-docs/project-status.md` (UPDATE)
- `/project-docs/file-structure-reference.md` (UPDATE)
- `/project-docs/onboarding-guide.md` (NEW)
- Various fixes to onboarding pages based on testing

### **Final Git Commit Message:**
```
feat(onboarding): Complete onboarding implementation with testing and polish

- Comprehensive end-to-end testing
- Visual and UX polish
- Documentation updates
- Edge case handling
- Production-ready onboarding flow

Part 5/5 of onboarding implementation - COMPLETE ✅
```

---

## 📊 **Implementation Summary**

### **Architecture Note:** All segments use Next.js 14 App Router with TypeScript exclusively.

**Total Work Breakdown:**
| Segment | Time Estimate | Token Cost | Priority | Dependencies |
|---------|---------------|------------|----------|--------------|
| Segment 1: Database & Helpers | 15-20 min | Low (~5k) | HIGH | None |
| Segment 2: Onboarding Screens | 30-40 min | Medium (~15k) | MEDIUM | Segment 1 |
| Segment 3: Goal Creation | 40-50 min | Medium-High (~20k) | MEDIUM | Segment 1 |
| Segment 4: Flow Control | 20-30 min | Medium (~10k) | HIGH | Segments 1-3 |
| Segment 5: Testing & Polish | 20-30 min | Low (~5k) | MEDIUM | Segments 1-4 |
| **TOTAL** | **~2.5-3 hours** | **~55k tokens** | - | - |

### **Suggested Session Breakdown:**

**Session 1: Foundation** (30-40 min)
- Complete Segment 1 (Database & Helpers)
- Test database changes
- Commit and document

**Session 2: UI Components** (70-90 min)
- Complete Segment 2 (Onboarding Screens)
- Complete Segment 3 (Goal Creation)
- Test pages individually
- Commit and document

**Session 3: Integration** (40-60 min)
- Complete Segment 4 (Flow Control)
- Complete Segment 5 (Testing & Polish)
- End-to-end testing
- Final commit and documentation

---

## 🚀 **How to Use This Document**

### **For New Chat Sessions:**

1. **Read this document first** to understand where we are in implementation
2. **Check completion checkboxes** to see what's done
3. **Pick a segment** to work on next
4. **Follow detailed steps** in that segment
5. **Update checkboxes** as you complete items
6. **Commit work** before ending session
7. **Update project-status.md** with progress

### **For Continuing Work:**

- This document is the single source of truth for onboarding implementation
- Each segment is independent and can be done in separate sessions
- Segments can be done in order or parallel (except Segment 4 requires all previous)
- Always test after completing a segment
- Always commit after completing a segment

### **For Future Reference:**

- After implementation complete, this document serves as architecture documentation
- Explains design decisions and implementation details
- Useful for debugging or future enhancements
- Reference for similar features in other projects

---

## 📝 **Status Tracking**

**Last Updated:** October 8, 2025

**Current Status:** Segments 1 & 2 Complete - Ready for Segment 4

**Completed:**
- ✅ Segment 1: Database schema & helpers implemented and tested
- ✅ Segment 2: 3-screen onboarding carousel implemented and tested

**Next Action:** Implement Segment 4 (Flow Control & Routing Logic)

**Blocked By:** None - ready to continue

**Notes:** 
- Database has `onboarding_completed` column with helper function
- Onboarding screens functional at `/onboarding` route
- Manual testing complete, all features working
- User chose to implement Segment 4 before Segment 3
- TypeScript build passes with no errors

---

**END OF DOCUMENT**
