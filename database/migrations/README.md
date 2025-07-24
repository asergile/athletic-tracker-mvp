# Database Migrations

This directory contains SQL migration files to update your Athletic Tracker database schema safely.

## URGENT: RLS Policy Fix Required

**⚠️ CRITICAL ISSUE:** Migration 001 has an infinite recursion bug in RLS policies that prevents goal creation.
**✅ SOLUTION:** Apply Migration 002 immediately to fix this.

## Migration Files

### `001_add_events_and_goals.sql`
**Status:** ✅ Applied (but has RLS bug)
**Purpose:** Adds event-driven banking system
**Changes:**
- Creates `events` table for competitions/goals
- Creates `athlete_goals` table for banking targets  
- Adds `weekly_workout_frequency` to `user_settings`
- Sets up RLS policies (has infinite recursion bug)
- Creates helper functions for banking calculations

### `002_fix_rls_policies.sql` 
**Status:** ⚠️ NEEDS TO BE APPLIED NOW
**Purpose:** Fixes infinite recursion in RLS policies
**Changes:**
- Removes problematic cross-table policy references
- Simplifies RLS policies to prevent recursion
- Enables goal creation to work properly

## How to Apply Migration 002 (Fix RLS Policies)

### Supabase Cloud (Recommended)
1. Open your Supabase project dashboard
2. Go to "SQL Editor"
3. Copy the entire contents of `002_fix_rls_policies.sql`
4. Paste and click "Run"
5. Verify no errors in output
6. Test goal creation in the app

### Verification After Migration 002
```sql
-- Test that policies work without recursion
SELECT id, name, event_date FROM events LIMIT 5;
SELECT id, athlete_id, event_id FROM athlete_goals LIMIT 5;
```

## How to Apply Migrations (General)

### 1. Local Development (Supabase Local)
If you're using Supabase locally:
```bash
supabase db reset
# Then apply migrations in order
```

### 2. Supabase Cloud (Recommended)
1. Open your Supabase project dashboard
2. Go to "SQL Editor"
3. Copy and paste the migration file contents
4. Run the SQL

### 3. Manual Application
Copy the SQL from each migration file and run it in your database.

## Rollback Instructions

If you need to undo a migration:

### Rollback 002 (Not recommended):
```sql
-- This would restore the buggy policies - don't do this!
DROP POLICY IF EXISTS "events_policy" ON events;
DROP POLICY IF EXISTS "athlete_goals_policy" ON athlete_goals;
```

### Rollback 001:
```sql
-- Remove tables (this will delete all events and goals data)
DROP TABLE IF EXISTS athlete_goals;
DROP TABLE IF EXISTS events;

-- Remove column from user_settings
ALTER TABLE user_settings DROP COLUMN IF EXISTS weekly_workout_frequency;

-- Remove functions
DROP FUNCTION IF EXISTS calculate_target_workouts(DATE, INTEGER);
DROP FUNCTION IF EXISTS get_banking_progress(UUID, UUID);
```

## Migration History

| Migration | Date | Status | Description |
|-----------|------|--------|-------------|
| 001 | 2025-07-23 | ✅ Applied | Initial events/goals schema (has RLS bug) |
| 002 | 2025-07-24 | ⚠️ Pending | **CRITICAL: Fix RLS infinite recursion** |

## Verification

After running migrations, verify with:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('events', 'athlete_goals');

-- Check column was added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name = 'weekly_workout_frequency';
```

## Notes

- Always backup your database before running migrations
- Test migrations on development environment first
- Migrations are designed to be idempotent (safe to run multiple times)
- Each migration includes verification queries at the bottom

---

**🚨 ACTION REQUIRED: Apply Migration 002 immediately to fix goal creation!**