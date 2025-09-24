# Supabase Security Implementation Guide

**Created:** September 22, 2025  
**Status:** Implementation Ready  
**Priority:** Critical - Must implement before production  
**Purpose:** Comprehensive security setup for Athletic Tracker database

---

## 🎯 **Security Implementation Status**

### **Implementation Phases**
- [ ] **Phase 1:** Core security setup (RLS, policies, profiles table)
- [ ] **Phase 2:** Audit logging and monitoring
- [ ] **Phase 3:** Advanced security features and testing
- [ ] **Phase 4:** Production security verification

### **Current Database Security State**
⚠️ **CRITICAL:** Assuming current tables may not have proper RLS policies  
🔒 **REQUIRED:** All security measures below must be implemented before production

---

## 📊 **Athletic Tracker Database Schema Security**

### **Profiles Table (NEW - Required)**
```sql
-- Create secure profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  display_name TEXT CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 50),
  avatar_url TEXT CHECK (avatar_url ~* '^https?://'),
  preferred_units TEXT DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
  privacy_level TEXT DEFAULT 'private' CHECK (privacy_level IN ('private', 'coaches', 'public')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Prevent email changes (security risk)
CREATE POLICY "Email is immutable" ON profiles
  FOR UPDATE USING (OLD.email = NEW.email);

-- Auto-create profiles trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### **Workouts Table Security**
```sql
-- Update existing workouts table with security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Add constraints if missing
ALTER TABLE workouts 
  ADD CONSTRAINT workouts_rating_check 
  CHECK (rating IN (1,2,3));

ALTER TABLE workouts 
  ADD CONSTRAINT workouts_duration_positive 
  CHECK (duration > 0);

-- Security Policies
CREATE POLICY "Users can manage own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id);

-- Audit fields (optional but recommended)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS 
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

### **Athlete Goals Table Security**
```sql
-- Enable RLS on athlete_goals
ALTER TABLE athlete_goals ENABLE ROW LEVEL SECURITY;

-- Add security constraints
ALTER TABLE athlete_goals 
  ADD CONSTRAINT goals_target_positive 
  CHECK (target_value > 0);

-- Security Policies
CREATE POLICY "Users can manage own goals" ON athlete_goals
  FOR ALL USING (auth.uid() = user_id);

-- Audit fields
ALTER TABLE athlete_goals ADD COLUMN IF NOT EXISTS 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE athlete_goals ADD COLUMN IF NOT EXISTS 
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

---

## 🔒 **Security Patterns for Application Code**

### **Secure Query Patterns (REQUIRED)**

```typescript
// ✅ SECURE - Get user workouts with profile info
export async function getUserWorkouts() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Authentication required')
  }

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id,
      workout_type,
      duration,
      rating,
      date,
      created_at,
      profiles!inner(display_name, email)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    console.error('Database error:', error)
    throw new Error('Unable to load workouts')
  }

  return data
}

// ✅ SECURE - Create workout with validation
export async function createWorkout(workoutData: {
  workout_type: string
  duration: number
  rating: number
}) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  // Server-side validation
  const validatedData = {
    workout_type: workoutData.workout_type.trim().slice(0, 50),
    duration: Math.max(1, Math.floor(workoutData.duration)),
    rating: Math.max(1, Math.min(3, Math.floor(workoutData.rating))),
    user_id: user.id,
    date: new Date().toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('workouts')
    .insert(validatedData)
    .select()

  if (error) {
    console.error('Workout creation error:', error)
    throw new Error('Unable to save workout')
  }

  return data[0]
}
```

### **Context Setup for Security**

```typescript
// lib/auth-context.tsx - Secure authentication context
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

type Profile = {
  id: string
  email: string
  display_name: string
  preferred_units: 'metric' | 'imperial'
  privacy_level: 'private' | 'coaches' | 'public'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile load error:', error)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Unexpected profile error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw new Error('Unable to sign out')
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

---

## 🛡️ **Security Testing Checklist**

### **Pre-Production Security Tests**
- [ ] **RLS Verification:** Try to access other users' data (should fail)
- [ ] **Input Validation:** Submit malicious data (should be sanitized/rejected)
- [ ] **Authentication Bypass:** Access protected routes without auth (should redirect)
- [ ] **SQL Injection:** Test with malicious input (Supabase should handle)
- [ ] **XSS Prevention:** Submit script tags in user input (should be escaped)
- [ ] **Rate Limiting:** Rapid API calls (should be throttled by Supabase)

### **Security Test Commands**
```javascript
// Test 1: Try to access another user's workouts
const { data } = await supabase
  .from('workouts')
  .select()
  .eq('user_id', 'different-user-id') // Should return empty due to RLS

// Test 2: Try to insert workout for different user
const { error } = await supabase
  .from('workouts')
  .insert({ 
    user_id: 'different-user-id', // Should fail RLS policy
    workout_type: 'run',
    duration: 30,
    rating: 2
  })

// Test 3: Try malicious input
const { error: xssError } = await supabase
  .from('profiles')
  .update({ 
    display_name: '<script>alert("xss")</script>' // Should be sanitized
  })
  .eq('id', user.id)
```

---

## 📋 **Implementation Checklist**

### **Phase 1: Core Security (CRITICAL)**
- [ ] Run all SQL commands above to create profiles table and enable RLS
- [ ] Test that profiles are auto-created when users sign up  
- [ ] Verify RLS policies prevent cross-user data access
- [ ] Update application code to use secure query patterns
- [ ] Add AuthContext with profile loading

### **Phase 2: Application Integration**
- [ ] Replace all direct database calls with secure functions
- [ ] Add input validation to all user-submitted data
- [ ] Implement proper error handling (no sensitive info leakage)
- [ ] Test authentication flows and session management

### **Phase 3: Security Verification**
- [ ] Run all security tests in checklist
- [ ] Verify no console errors in production build
- [ ] Test cross-device sync works securely
- [ ] Confirm data isolation between users

### **Phase 4: Production Readiness**
- [ ] Environment variables configured securely
- [ ] Service role key never exposed to client
- [ ] All database queries use RLS policies
- [ ] Error monitoring in place

---

## ⚠️ **CRITICAL Security Requirements**

### **NEVER DO These Things**
- ❌ Expose service role key to client-side code
- ❌ Use `auth.users` table directly in queries
- ❌ Disable RLS on tables with user data
- ❌ Trust client-side validation only
- ❌ Return raw error messages to users
- ❌ Allow SQL injection through string concatenation

### **ALWAYS DO These Things**
- ✅ Enable RLS on all user data tables
- ✅ Filter queries by `auth.uid()` in policies
- ✅ Validate and sanitize all user input
- ✅ Use the profiles table for user info
- ✅ Test security by trying to break it
- ✅ Log security events for monitoring

---

## 🔄 **Database Migration Strategy**

### **For Existing Data**
If you have existing workouts/goals without proper security:

```sql
-- 1. First, enable RLS (this will block all access initially)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- 2. Create policies to restore access
CREATE POLICY "Users can manage own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id);

-- 3. If you have workouts with null user_id, you'll need to clean up:
-- DELETE FROM workouts WHERE user_id IS NULL;
```

### **Data Cleanup Required**
Before enabling RLS, ensure:
- All workouts have valid user_id values
- All athlete_goals have valid user_id values  
- No orphaned records exist

---

## 📊 **Security Monitoring**

### **Key Metrics to Track**
- Failed authentication attempts
- RLS policy violations (should be zero)
- Database errors (potential attack indicators)
- Unusual query patterns
- Session duration and activity

### **Logging Setup**
```sql
-- Optional: Create audit log table
CREATE TABLE security_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE security_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only service can write audit logs" ON security_audit
  FOR INSERT WITH CHECK (false); -- Only service role can insert
```

---

**Status:** Ready for Implementation  
**Next Steps:** Run Phase 1 SQL commands, then update application code  
**Success Criteria:** All security tests pass, no cross-user data access possible

**🚨 CRITICAL:** Do not deploy to production without implementing all Phase 1 security measures.