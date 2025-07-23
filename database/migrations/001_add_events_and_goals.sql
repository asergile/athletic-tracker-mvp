-- Migration 001: Add Events and Goals for Banking System
-- Run this in your Supabase SQL Editor
-- Date: July 23, 2025

-- 1. Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  goal TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create athlete_goals table (links athletes to events with banking targets)
CREATE TABLE IF NOT EXISTS athlete_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  target_workouts INTEGER NOT NULL CHECK (target_workouts > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(athlete_id, event_id)
);

-- 3. Add weekly workout frequency to user_settings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'weekly_workout_frequency'
    ) THEN
        ALTER TABLE user_settings 
        ADD COLUMN weekly_workout_frequency INTEGER DEFAULT 4 
        CHECK (weekly_workout_frequency > 0 AND weekly_workout_frequency <= 14);
    END IF;
END $$;

-- 4. Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_goals ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for events
-- Users can manage (view, create, update, delete) their own events
DROP POLICY IF EXISTS "Users can manage own events" ON events;
CREATE POLICY "Users can manage own events" ON events
  FOR ALL USING (auth.uid() = created_by);

-- Users can view events they have goals for (for shared events in future)
DROP POLICY IF EXISTS "Users can view events they joined" ON events;
CREATE POLICY "Users can view events they joined" ON events
  FOR SELECT USING (
    id IN (
      SELECT event_id FROM athlete_goals WHERE athlete_id = auth.uid()
    )
  );

-- 6. Create RLS policies for athlete_goals
-- Users can manage their own goals
DROP POLICY IF EXISTS "Users can manage own goals" ON athlete_goals;
CREATE POLICY "Users can manage own goals" ON athlete_goals
  FOR ALL USING (auth.uid() = athlete_id);

-- Event creators can view who joined their events (for coach features later)
DROP POLICY IF EXISTS "Event creators can view participants" ON athlete_goals;
CREATE POLICY "Event creators can view participants" ON athlete_goals
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS events_created_by_idx ON events(created_by);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON events(event_date);
CREATE INDEX IF NOT EXISTS athlete_goals_athlete_id_idx ON athlete_goals(athlete_id);
CREATE INDEX IF NOT EXISTS athlete_goals_event_id_idx ON athlete_goals(event_id);
CREATE INDEX IF NOT EXISTS athlete_goals_athlete_event_idx ON athlete_goals(athlete_id, event_id);

-- 8. Create updated_at triggers
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_goals_updated_at
    BEFORE UPDATE ON athlete_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant permissions
GRANT ALL ON events TO authenticated;
GRANT ALL ON athlete_goals TO authenticated;

-- 10. Create function to calculate target workouts
CREATE OR REPLACE FUNCTION calculate_target_workouts(
  p_event_date DATE,
  p_weekly_frequency INTEGER
) RETURNS INTEGER AS $$
DECLARE
  weeks_remaining DECIMAL;
  target_workouts INTEGER;
BEGIN
  -- Calculate weeks remaining from today to event date
  weeks_remaining := EXTRACT(EPOCH FROM (p_event_date - CURRENT_DATE)) / (7 * 24 * 60 * 60);
  
  -- Ensure we have at least partial week
  IF weeks_remaining <= 0 THEN
    weeks_remaining := 0.1;
  END IF;
  
  -- Calculate target workouts (round up to ensure full preparation)
  target_workouts := CEIL(weeks_remaining * p_weekly_frequency);
  
  -- Minimum of 1 workout
  IF target_workouts < 1 THEN
    target_workouts := 1;
  END IF;
  
  RETURN target_workouts;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to get banking progress for a goal
CREATE OR REPLACE FUNCTION get_banking_progress(
  p_athlete_id UUID,
  p_goal_id UUID
) RETURNS TABLE (
  workouts_completed INTEGER,
  target_workouts INTEGER,
  hours_completed DECIMAL,
  goal_created_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(w.id)::INTEGER as workouts_completed,
    ag.target_workouts,
    COALESCE(SUM(w.duration), 0)::DECIMAL / 60 as hours_completed,
    ag.created_at::DATE as goal_created_date
  FROM athlete_goals ag
  LEFT JOIN workouts w ON (
    w.user_id = ag.athlete_id 
    AND w.date >= ag.created_at::DATE
  )
  WHERE ag.id = p_goal_id 
    AND ag.athlete_id = p_athlete_id
  GROUP BY ag.target_workouts, ag.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Verification queries (comment out after running)
/*
-- Verify tables were created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('events', 'athlete_goals')
ORDER BY table_name, ordinal_position;

-- Verify user_settings column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name = 'weekly_workout_frequency';

-- Test the calculation function
SELECT calculate_target_workouts(CURRENT_DATE + INTERVAL '8 weeks', 4) as target_for_8_weeks;
*/