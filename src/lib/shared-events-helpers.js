// New Database Helpers for Shared Events Architecture
// These functions work with the new Events vs Goals separation

// SHARED EVENTS FUNCTIONS

/**
 * Create a new shared event that can be discovered by others
 */
export const createSharedEvent = async (eventData) => {
  try {
    const { data, error } = await supabase
      .from('shared_events')
      .insert({
        name: eventData.name,
        event_date: eventData.eventDate,
        description: eventData.description || null,
        location: eventData.location || null,
        sport: eventData.sport || null,
        is_discoverable: eventData.isDiscoverable || false,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Track that user created this event
    await trackEventDiscovery(data.id, 'MANUAL_CREATE');
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating shared event:', error);
    return { data: null, error };
  }
};

/**
 * Find events by name/date (for suggesting similar events)
 */
export const findSimilarEvents = async (name, eventDate) => {
  try {
    const { data, error } = await supabase
      .from('shared_events')
      .select(`
        *,
        created_by_profile:profiles!shared_events_created_by_fkey(
          display_name,
          email
        )
      `)
      .or(`name.ilike.%${name}%,event_date.eq.${eventDate}`)
      .eq('is_discoverable', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error finding similar events:', error);
    return { data: null, error };
  }
};

/**
 * Get event by share token (for QR codes/links)
 */
export const getEventByShareToken = async (shareToken) => {
  try {
    const { data, error } = await supabase
      .from('shared_events')
      .select(`
        *,
        created_by_profile:profiles!shared_events_created_by_fkey(
          display_name,
          email
        )
      `)
      .eq('share_token', shareToken)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting event by share token:', error);
    return { data: null, error };
  }
};

/**
 * Join an existing event via share token
 */
export const joinEventByShareToken = async (shareToken, discoveryMethod = 'SHARE_LINK') => {
  try {
    // First get the event
    const eventResult = await getEventByShareToken(shareToken);
    if (eventResult.error) throw eventResult.error;
    
    // Track the discovery
    await trackEventDiscovery(eventResult.data.id, discoveryMethod);
    
    return { data: eventResult.data, error: null };
  } catch (error) {
    console.error('Error joining event by share token:', error);
    return { data: null, error };
  }
};

/**
 * Get discoverable events (public browse)
 */
export const getDiscoverableEvents = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('shared_events')
      .select(`
        *,
        created_by_profile:profiles!shared_events_created_by_fkey(
          display_name,
          email
        ),
        goal_count:athlete_goals(count)
      `)
      .eq('is_discoverable', true)
      .gte('event_date', new Date().toISOString().split('T')[0]) // Future events only
      .order('event_date', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting discoverable events:', error);
    return { data: null, error };
  }
};

// ATHLETE GOALS FUNCTIONS

/**
 * Create an athlete goal for a specific event
 */
export const createAthleteGoal = async (goalData) => {
  try {
    // Calculate target workouts based on weeks remaining and frequency
    const eventDate = new Date(goalData.eventDate);
    const today = new Date();
    const diffTime = eventDate - today;
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const weeksRemaining = Math.max(0.1, daysRemaining / 7);
    const targetWorkouts = Math.ceil(weeksRemaining * (goalData.weeklyFrequency || 4));
    const targetHours = Math.ceil(targetWorkouts * 1.3); // Estimate ~1.3h per workout
    
    const { data, error } = await supabase
      .from('athlete_goals')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        event_id: goalData.eventId,
        goal_description: goalData.goalDescription,
        weekly_frequency: goalData.weeklyFrequency || 4,
        sport: goalData.sport || 'Swimming',
        target_workouts: targetWorkouts,
        target_hours: targetHours,
        days_remaining: daysRemaining
      })
      .select(`
        *,
        event:shared_events(*)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating athlete goal:', error);
    return { data: null, error };
  }
};

/**
 * Get all goals for current user
 */
export const getUserGoalsNew = async () => {
  try {
    const { data, error } = await supabase
      .from('athlete_goals')
      .select(`
        *,
        event:shared_events(*),
        shared_with:goal_shares(
          shared_with,
          share_type,
          shared_with_profile:profiles!goal_shares_shared_with_fkey(
            display_name,
            email
          )
        )
      `)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user goals:', error);
    return { data: null, error };
  }
};

/**
 * Update goal progress (called when workout is logged)
 */
export const updateGoalProgress = async (goalId, workoutsCompleted, hoursCompleted) => {
  try {
    const { data, error } = await supabase
      .from('athlete_goals')
      .update({
        workouts_completed: workoutsCompleted,
        hours_completed: hoursCompleted
      })
      .eq('id', goalId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating goal progress:', error);
    return { data: null, error };
  }
};

// GOAL SHARING FUNCTIONS

/**
 * Share a goal with someone
 */
export const shareGoalWith = async (goalId, sharedWithEmail, shareType = 'COACH') => {
  try {
    // First find the user by email
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', sharedWithEmail)
      .single();
    
    if (profileError) throw new Error('User not found with that email');
    
    const { data, error } = await supabase
      .from('goal_shares')
      .insert({
        goal_id: goalId,
        shared_by: (await supabase.auth.getUser()).data.user?.id,
        shared_with: userProfile.user_id,
        share_type: shareType
      })
      .select(`
        *,
        shared_with_profile:profiles!goal_shares_shared_with_fkey(
          display_name,
          email
        )
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error sharing goal:', error);
    return { data: null, error };
  }
};

/**
 * Remove goal sharing
 */
export const removeGoalShare = async (shareId) => {
  try {
    const { error } = await supabase
      .from('goal_shares')
      .delete()
      .eq('id', shareId)
      .eq('shared_by', (await supabase.auth.getUser()).data.user?.id);
    
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    console.error('Error removing goal share:', error);
    return { data: null, error };
  }
};

/**
 * Get goals shared with current user
 */
export const getGoalsSharedWithMe = async () => {
  try {
    const { data, error } = await supabase
      .from('goal_shares')
      .select(`
        *,
        goal:athlete_goals(
          *,
          event:shared_events(*),
          owner:profiles!athlete_goals_user_id_fkey(
            display_name,
            email
          )
        )
      `)
      .eq('shared_with', (await supabase.auth.getUser()).data.user?.id);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting goals shared with me:', error);
    return { data: null, error };
  }
};

// DISCOVERY TRACKING

/**
 * Track how user discovered an event (for analytics)
 */
export const trackEventDiscovery = async (eventId, discoveryMethod, referrerId = null) => {
  try {
    const { data, error } = await supabase
      .from('event_discoveries')
      .insert({
        event_id: eventId,
        discovered_by: (await supabase.auth.getUser()).data.user?.id,
        discovery_method: discoveryMethod,
        referrer_id: referrerId
      });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error tracking event discovery:', error);
    return { data: null, error };
  }
};

// MIGRATION HELPERS (to transition from old to new schema)

/**
 * Migrate user's existing goals to new architecture
 */
export const migrateUserGoalsToNewSchema = async () => {
  try {
    // Get user's existing goals from old schema
    const { data: oldGoals, error: oldError } = await supabase
      .from('athlete_goals') // Old table
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
    
    if (oldError) throw oldError;
    
    const migratedGoals = [];
    
    for (const oldGoal of oldGoals) {
      // Create shared event first
      const eventResult = await createSharedEvent({
        name: oldGoal.events?.name || 'Migrated Event',
        eventDate: oldGoal.events?.event_date,
        description: oldGoal.events?.goal,
        isDiscoverable: false // Keep migrated events private initially
      });
      
      if (eventResult.error) continue;
      
      // Create new goal linked to shared event
      const goalResult = await createAthleteGoal({
        eventId: eventResult.data.id,
        goalDescription: oldGoal.events?.goal || 'Personal Goal',
        weeklyFrequency: oldGoal.events?.weekly_workout_frequency || 4,
        sport: 'Swimming',
        eventDate: oldGoal.events?.event_date
      });
      
      if (!goalResult.error) {
        migratedGoals.push(goalResult.data);
      }
    }
    
    return { data: migratedGoals, error: null };
  } catch (error) {
    console.error('Error migrating user goals:', error);
    return { data: null, error };
  }
};
