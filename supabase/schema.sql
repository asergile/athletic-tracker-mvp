-- Athletic Tracker MVP Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_type TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  rating INTEGER NOT NULL CHECK (rating IN (1, 2, 3)),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_workouts_updated_at ON workouts;
CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can only see their own workouts
DROP POLICY IF EXISTS \"Users can view own workouts\" ON workouts;
CREATE POLICY \"Users can view own workouts\" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own workouts
DROP POLICY IF EXISTS \"Users can insert own workouts\" ON workouts;
CREATE POLICY \"Users can insert own workouts\" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own workouts
DROP POLICY IF EXISTS \"Users can update own workouts\" ON workouts;
CREATE POLICY \"Users can update own workouts\" ON workouts
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own workouts
DROP POLICY IF EXISTS \"Users can delete own workouts\" ON workouts;
CREATE POLICY \"Users can delete own workouts\" ON workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS workouts_user_id_date_idx ON workouts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS workouts_user_id_created_at_idx ON workouts(user_id, created_at DESC);

-- Create user_settings table for future use
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_goal_hours DECIMAL(4,2) DEFAULT 6.0 CHECK (weekly_goal_hours > 0 AND weekly_goal_hours <= 99.99),
  privacy_level TEXT DEFAULT 'standard' CHECK (privacy_level IN ('standard', 'private', 'public')),
  auto_logout_hours INTEGER DEFAULT 48 CHECK (auto_logout_hours > 0),
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
DROP POLICY IF EXISTS \"Users can manage own settings\" ON user_settings;
CREATE POLICY \"Users can manage own settings\" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger for user_settings updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize user settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create user settings
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.workouts TO authenticated;
GRANT ALL ON public.user_settings TO authenticated;

-- Example data (optional - remove in production)
-- This creates sample data for testing
/*
INSERT INTO workouts (user_id, workout_type, duration, rating, date) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Swimming', 60, 3, CURRENT_DATE - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000000', 'Running', 45, 2, CURRENT_DATE - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000000', 'Weight Training', 30, 3, CURRENT_DATE);
*/

-- View to check table structure
/*
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('workouts', 'user_settings')
ORDER BY table_name, ordinal_position;
*/
