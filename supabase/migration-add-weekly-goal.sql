-- Migration: Add weekly_goal_hours column to user_settings table
-- Run this in your Supabase SQL Editor if you already created the user_settings table

-- Add the weekly_goal_hours column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'weekly_goal_hours'
    ) THEN
        ALTER TABLE user_settings 
        ADD COLUMN weekly_goal_hours DECIMAL(4,2) DEFAULT 6.0 
        CHECK (weekly_goal_hours > 0 AND weekly_goal_hours <= 99.99);
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name = 'weekly_goal_hours';
