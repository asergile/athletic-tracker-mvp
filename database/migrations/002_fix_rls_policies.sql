-- Migration 002: Fix RLS Policies - Remove Infinite Recursion
-- Run this in your Supabase SQL Editor
-- Date: July 24, 2025

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Users can manage own events" ON events;
DROP POLICY IF EXISTS "Users can view events they joined" ON events;
DROP POLICY IF EXISTS "Users can manage own goals" ON athlete_goals;
DROP POLICY IF EXISTS "Event creators can view participants" ON athlete_goals;

-- 2. Create simplified RLS policies for events
-- Users can only manage their own created events (no cross-references)
CREATE POLICY "events_policy" ON events
  FOR ALL USING (auth.uid() = created_by);

-- 3. Create simplified RLS policies for athlete_goals  
-- Users can only manage their own goals (no cross-references)
CREATE POLICY "athlete_goals_policy" ON athlete_goals
  FOR ALL USING (auth.uid() = athlete_id);

-- 4. Verify policies are working
-- Test query (run this after migration to verify)
/*
-- This should only return events created by the current user
SELECT id, name, event_date FROM events LIMIT 5;

-- This should only return goals for the current user  
SELECT id, athlete_id, event_id FROM athlete_goals LIMIT 5;
*/

-- Migration complete - RLS policies fixed to prevent infinite recursion
