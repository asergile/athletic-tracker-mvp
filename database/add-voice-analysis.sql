-- Add voice analysis capabilities to workouts table
-- Run this in your Supabase SQL Editor or via psql

-- Add workout_analysis column to store voice analysis data
ALTER TABLE workouts 
ADD COLUMN workout_analysis JSONB;

-- Add index for better query performance on workout_analysis
CREATE INDEX idx_workouts_workout_analysis 
ON workouts USING gin(workout_analysis);

-- Add comment explaining the column
COMMENT ON COLUMN workouts.workout_analysis IS 'Stores voice analysis data including transcription, analysis, and edit history';

-- Example of the JSON structure this column will store:
-- {
--   "transcription": "Today I did a great swimming workout...",
--   "analysis": "# John's Workout - 2025-09-09\n## WORKOUT STRUCTURE...",
--   "editHistory": {
--     "transcriptionEdits": 1,
--     "analysisEdits": 0,
--     "lastEditedAt": "2025-09-09T10:30:00Z"
--   }
-- }
