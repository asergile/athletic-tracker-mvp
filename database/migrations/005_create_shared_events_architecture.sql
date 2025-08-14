-- Migration 005: Create Shared Events Architecture
-- This creates the foundation for Events vs Goals separation and future coach/QR features
-- Created: August 14, 2025

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shared Events Table (replaces/evolves current events table)
CREATE TABLE shared_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    event_date DATE NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID, -- For future coach/club features
    share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'base64url'),
    is_discoverable BOOLEAN DEFAULT false,
    location TEXT,
    sport TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Athlete Goals Table (personal goals for specific events)
CREATE TABLE athlete_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES shared_events(id) ON DELETE CASCADE,
    goal_description TEXT NOT NULL,
    weekly_frequency INTEGER DEFAULT 4,
    sport TEXT DEFAULT 'Swimming',
    target_workouts INTEGER,
    target_hours INTEGER,
    workouts_completed INTEGER DEFAULT 0,
    hours_completed INTEGER DEFAULT 0,
    days_remaining INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id) -- One goal per user per event
);

-- Goal Sharing Table (flexible sharing with multiple people)
CREATE TABLE goal_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES athlete_goals(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_type TEXT DEFAULT 'COACH', -- COACH, TEAMMATE, PARENT, PUBLIC, etc.
    permissions TEXT DEFAULT 'VIEW_ONLY', -- VIEW_ONLY, COMMENT, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(goal_id, shared_with) -- Can't share same goal with same person twice
);

-- Event Discovery Tracking (analytics for how people find events)
CREATE TABLE event_discoveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES shared_events(id) ON DELETE CASCADE,
    discovered_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    discovery_method TEXT NOT NULL, -- QR_SCAN, SHARE_LINK, SEARCH, INVITE, MANUAL_CREATE
    referrer_id UUID REFERENCES auth.users(id), -- Who shared it, if applicable
    discovered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update trigger for shared_events
CREATE OR REPLACE FUNCTION update_shared_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shared_events_updated_at
    BEFORE UPDATE ON shared_events
    FOR EACH ROW
    EXECUTE FUNCTION update_shared_events_updated_at();

-- Update trigger for athlete_goals
CREATE OR REPLACE FUNCTION update_athlete_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_athlete_goals_updated_at
    BEFORE UPDATE ON athlete_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_athlete_goals_updated_at();

-- Row Level Security Policies

-- Shared Events: Users can see public events and events they created
ALTER TABLE shared_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view discoverable events and their own events" ON shared_events
    FOR SELECT USING (
        is_discoverable = true OR 
        created_by = auth.uid()
    );

CREATE POLICY "Users can create their own events" ON shared_events
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own events" ON shared_events
    FOR UPDATE USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own events" ON shared_events
    FOR DELETE USING (created_by = auth.uid());

-- Athlete Goals: Users can only see their own goals (unless shared)
ALTER TABLE athlete_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" ON athlete_goals
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own goals" ON athlete_goals
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own goals" ON athlete_goals
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own goals" ON athlete_goals
    FOR DELETE USING (user_id = auth.uid());

-- Goal Shares: Users can see shares they created or shares directed to them
ALTER TABLE goal_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view goal shares they created or received" ON goal_shares
    FOR SELECT USING (
        shared_by = auth.uid() OR 
        shared_with = auth.uid()
    );

CREATE POLICY "Users can create goal shares for their own goals" ON goal_shares
    FOR INSERT WITH CHECK (
        shared_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM athlete_goals 
            WHERE id = goal_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete goal shares they created" ON goal_shares
    FOR DELETE USING (shared_by = auth.uid());

-- Event Discoveries: Users can see their own discovery records
ALTER TABLE event_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event discoveries" ON event_discoveries
    FOR SELECT USING (discovered_by = auth.uid());

CREATE POLICY "Users can create their own discovery records" ON event_discoveries
    FOR INSERT WITH CHECK (discovered_by = auth.uid());

-- Indexes for performance
CREATE INDEX idx_shared_events_created_by ON shared_events(created_by);
CREATE INDEX idx_shared_events_event_date ON shared_events(event_date);
CREATE INDEX idx_shared_events_share_token ON shared_events(share_token);
CREATE INDEX idx_shared_events_discoverable ON shared_events(is_discoverable) WHERE is_discoverable = true;

CREATE INDEX idx_athlete_goals_user_id ON athlete_goals(user_id);
CREATE INDEX idx_athlete_goals_event_id ON athlete_goals(event_id);
CREATE INDEX idx_athlete_goals_user_event ON athlete_goals(user_id, event_id);

CREATE INDEX idx_goal_shares_goal_id ON goal_shares(goal_id);
CREATE INDEX idx_goal_shares_shared_with ON goal_shares(shared_with);

CREATE INDEX idx_event_discoveries_event_id ON event_discoveries(event_id);
CREATE INDEX idx_event_discoveries_discovered_by ON event_discoveries(discovered_by);

-- Comments for documentation
COMMENT ON TABLE shared_events IS 'Events that can be shared via QR codes, links, or discovery. Support individual and team/coach created events.';
COMMENT ON TABLE athlete_goals IS 'Personal goals that athletes set for specific events. Includes work banking calculations.';
COMMENT ON TABLE goal_shares IS 'Flexible sharing system allowing athletes to share goals with coaches, teammates, family, etc.';
COMMENT ON TABLE event_discoveries IS 'Analytics tracking for how users discover and join events.';

COMMENT ON COLUMN shared_events.share_token IS 'Unique token for sharing via QR codes, links, or other methods';
COMMENT ON COLUMN shared_events.is_discoverable IS 'Whether this event appears in public search/browse functionality';
COMMENT ON COLUMN athlete_goals.target_workouts IS 'Calculated target based on weeks remaining and weekly frequency';
COMMENT ON COLUMN goal_shares.share_type IS 'Relationship type: COACH, TEAMMATE, PARENT, PUBLIC, etc.';
COMMENT ON COLUMN event_discoveries.discovery_method IS 'How the user found this event: QR_SCAN, SHARE_LINK, SEARCH, etc.';
