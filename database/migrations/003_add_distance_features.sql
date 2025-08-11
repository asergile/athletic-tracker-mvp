  -- Migration 003: Add Distance Features and Enhanced Workout Types
  -- Run this in your Supabase SQL Editor
  -- Date: August 7, 2025

  -- 1. Add distance columns to workouts table
  ALTER TABLE workouts 
  ADD COLUMN IF NOT EXISTS distance DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS distance_unit VARCHAR(20);

  -- 2. Add distance unit preferences to user_settings
  DO $$ 
  BEGIN
      IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_settings' 
          AND column_name = 'distance_unit_cardio'
      ) THEN
          ALTER TABLE user_settings 
          ADD COLUMN distance_unit_cardio VARCHAR(20) DEFAULT 'miles';
      END IF;
  END $$;

  DO $$ 
  BEGIN
      IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_settings' 
          AND column_name = 'distance_unit_swimming'
      ) THEN
          ALTER TABLE user_settings 
          ADD COLUMN distance_unit_swimming VARCHAR(20) DEFAULT 'meters';
      END IF;
  END $$;

  -- 3. Create custom workout types table for user-specific activities
  CREATE TABLE IF NOT EXISTS custom_workout_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
  );

  -- 4. Enable Row Level Security for custom workout types
  ALTER TABLE custom_workout_types ENABLE ROW LEVEL SECURITY;

  -- 5. Create RLS policy for custom workout types
  DROP POLICY IF EXISTS "Users can manage own custom workout types" ON custom_workout_types;
  CREATE POLICY "Users can manage own custom workout types" ON custom_workout_types
    FOR ALL USING (auth.uid() = user_id);

  -- 6. Create indexes for performance
  CREATE INDEX IF NOT EXISTS workouts_distance_idx ON workouts(distance) WHERE distance IS NOT NULL;
  CREATE INDEX IF NOT EXISTS custom_workout_types_user_id_idx ON custom_workout_types(user_id);

  -- 7. Grant permissions
  GRANT ALL ON custom_workout_types TO authenticated;

  -- 8. Create function to get user's distance unit preference based on workout type
  CREATE OR REPLACE FUNCTION get_user_distance_unit(
    p_user_id UUID,
    p_workout_type TEXT
  ) RETURNS TEXT AS $$
  DECLARE
    unit_preference TEXT;
  BEGIN
    -- Determine if this is a swimming workout
    IF LOWER(p_workout_type) LIKE '%swim%' THEN
      SELECT distance_unit_swimming INTO unit_preference
      FROM user_settings 
      WHERE user_id = p_user_id;
      
      -- Default to meters if no preference set
      RETURN COALESCE(unit_preference, 'meters');
    ELSE
      -- For all other workout types, use cardio preference
      SELECT distance_unit_cardio INTO unit_preference
      FROM user_settings 
      WHERE user_id = p_user_id;
      
      -- Default to miles if no preference set
      RETURN COALESCE(unit_preference, 'miles');
    END IF;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- 9. Create function to get user's complete workout types (default + custom)
  CREATE OR REPLACE FUNCTION get_user_workout_types(
    p_user_id UUID
  ) RETURNS TABLE (
    id UUID,
    name TEXT,
    is_custom BOOLEAN
  ) AS $
  BEGIN
    RETURN QUERY
    -- Default workout types (no ID since they're not stored)
    SELECT 
      NULL::UUID as id,
      default_types.name,
      false as is_custom
    FROM (
      VALUES 
        ('Swimming'),
        ('Running'),
        ('Cycling'),
        ('Weight Training'),
        ('Dryland'),
        ('CrossFit'),
        ('Walking'),
        ('Soccer'),
        ('Tennis'),
        ('Other')
    ) AS default_types(name)
    
    UNION ALL
    
    -- User's custom workout types (include ID for deletion)
    SELECT 
      cwt.id,
      cwt.name, 
      true as is_custom
    FROM custom_workout_types cwt
    WHERE cwt.user_id = p_user_id
    ORDER BY is_custom, name;
  END;
  $ LANGUAGE plpgsql SECURITY DEFINER;

  -- 10. Update the banking progress function to handle retroactive workouts properly
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
      AND w.date >= ag.created_at::DATE  -- Only count workouts after goal creation
    )
    WHERE ag.id = p_goal_id 
      AND ag.athlete_id = p_athlete_id
    GROUP BY ag.target_workouts, ag.created_at;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- 11. Verification queries (comment out after running)
  /*
  -- Verify distance columns were added
  SELECT column_name, data_type, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'workouts' 
  AND column_name IN ('distance', 'distance_unit');

  -- Verify user_settings columns were added
  SELECT column_name, data_type, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'user_settings' 
  AND column_name IN ('distance_unit_cardio', 'distance_unit_swimming');

  -- Verify custom workout types table
  SELECT table_name, column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'custom_workout_types'
  ORDER BY ordinal_position;

  -- Test distance unit function
  SELECT get_user_distance_unit(auth.uid(), 'Swimming') as swimming_unit,
        get_user_distance_unit(auth.uid(), 'Running') as running_unit;
  */
