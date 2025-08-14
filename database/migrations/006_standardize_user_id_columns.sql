-- Migration 006: Standardize user_id columns
-- Change athlete_id to user_id in athlete_goals table for consistency
-- Created: August 14, 2025

-- Step 1: Drop all existing policies that depend on athlete_id
DROP POLICY IF EXISTS "athlete_goals_policy" ON athlete_goals;
DROP POLICY IF EXISTS "Users can manage own goals" ON athlete_goals;
DROP POLICY IF EXISTS "Event creators can view participants" ON athlete_goals;

-- Step 2: Drop existing indexes
DROP INDEX IF EXISTS athlete_goals_athlete_id_idx;
DROP INDEX IF EXISTS athlete_goals_athlete_event_idx;

-- Step 3: Drop the unique constraint
ALTER TABLE athlete_goals DROP CONSTRAINT IF EXISTS athlete_goals_athlete_id_event_id_key;

-- Step 4: Add new user_id column
ALTER TABLE athlete_goals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Copy data from athlete_id to user_id
UPDATE athlete_goals SET user_id = athlete_id;

-- Step 6: Make user_id NOT NULL
ALTER TABLE athlete_goals ALTER COLUMN user_id SET NOT NULL;

-- Step 7: Now we can safely drop the athlete_id column
ALTER TABLE athlete_goals DROP COLUMN athlete_id;

-- Step 8: Add the new unique constraint
ALTER TABLE athlete_goals ADD CONSTRAINT athlete_goals_user_id_event_id_key UNIQUE(user_id, event_id);

-- Step 9: Create new indexes
CREATE INDEX athlete_goals_user_id_idx ON athlete_goals(user_id);
CREATE INDEX athlete_goals_user_event_idx ON athlete_goals(user_id, event_id);

-- Step 10: Create new RLS policies with user_id
CREATE POLICY "Users can manage own goals" ON athlete_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Event creators can view participants" ON athlete_goals
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- Step 11: Update comments
COMMENT ON COLUMN athlete_goals.user_id IS 'User ID - references auth.users(id), standardized naming convention';
