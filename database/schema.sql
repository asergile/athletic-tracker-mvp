-- Athletic Tracker Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE workout_type AS ENUM ('pool', 'dryland', 'weights');
CREATE TYPE workout_rating AS ENUM ('1', '2', '3');
CREATE TYPE sport_type AS ENUM ('swimming', 'track', 'cycling', 'triathlon');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    sport sport_type NOT NULL DEFAULT 'swimming',
    team_id UUID,
    coach_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Teams table
CREATE TABLE public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    sport sport_type NOT NULL DEFAULT 'swimming',
    coach_id UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workouts table
CREATE TABLE public.workouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INTEGER NOT NULL,
    distance_yards INTEGER,
    workout_type workout_type NOT NULL DEFAULT 'pool',
    rating workout_rating NOT NULL DEFAULT '2',
    notes TEXT,
    voice_transcript TEXT,
    processed_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraint for team_id in users table
ALTER TABLE public.users 
ADD CONSTRAINT users_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id);

-- Add foreign key constraint for coach_id in users table  
ALTER TABLE public.users 
ADD CONSTRAINT users_coach_id_fkey 
FOREIGN KEY (coach_id) REFERENCES public.users(id);

-- Indexes for performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_date ON public.workouts(date);
CREATE INDEX idx_workouts_user_date ON public.workouts(user_id, date DESC);
CREATE INDEX idx_users_team_id ON public.users(team_id);
CREATE INDEX idx_users_coach_id ON public.users(coach_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for first login)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Workouts policies - users can only access their own workouts
CREATE POLICY "Users can view own workouts" ON public.workouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON public.workouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON public.workouts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON public.workouts
    FOR DELETE USING (auth.uid() = user_id);

-- Teams policies - users can view teams they belong to
CREATE POLICY "Users can view their team" ON public.teams
    FOR SELECT USING (
        id IN (
            SELECT team_id FROM public.users WHERE id = auth.uid()
        ) OR
        coach_id = auth.uid()
    );

-- Coaches can update their teams
CREATE POLICY "Coaches can update their teams" ON public.teams
    FOR UPDATE USING (coach_id = auth.uid());

-- Coaches can create teams
CREATE POLICY "Coaches can create teams" ON public.teams
    FOR INSERT WITH CHECK (coach_id = auth.uid());

-- Functions for updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER handle_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_teams_updated_at 
    BEFORE UPDATE ON public.teams 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_workouts_updated_at 
    BEFORE UPDATE ON public.workouts 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Views for analytics
CREATE VIEW public.workout_analytics AS
SELECT 
    user_id,
    DATE_TRUNC('week', date) as week_start,
    COUNT(*) as workout_count,
    SUM(distance_yards) as total_distance,
    SUM(duration_minutes) as total_duration,
    AVG(rating::INTEGER) as average_rating,
    COUNT(*) FILTER (WHERE rating = '3') as good_workouts,
    COUNT(*) FILTER (WHERE rating = '1') as below_average_workouts
FROM public.workouts
GROUP BY user_id, DATE_TRUNC('week', date);

-- Grant permissions
GRANT SELECT ON public.workout_analytics TO authenticated;
