import { createClient } from '@supabase/supabase-js'

// Supabase Configuration - Next.js environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase initialization debug:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl?.substring(0, 20) + '...'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', { supabaseUrl, supabaseAnonKey });
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session in URL (for OAuth callbacks)
    detectSessionInUrl: true,
    // Flow type for authentication
    flowType: 'pkce'
  }
})

// Auth helper functions
export const authHelpers = {
  // Sign in with email/password
  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign up with email/password
  signUpWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }
}

// Database helper functions
export const dbHelpers = {
  // Create workout - NOW INCLUDES USER_ID
  createWorkout: async (workoutData) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    // Create timezone-aware date if none provided
    let workoutDate = workoutData.date;
    if (!workoutDate) {
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      workoutDate = localDate.toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('workouts')
      .insert([{
        user_id: user.id,  // FIX: Add user_id
        workout_type: workoutData.type,
        duration: workoutData.duration,
        rating: workoutData.rating,
        date: workoutDate,
        distance: workoutData.distance,
        distance_unit: workoutData.distance_unit
      }])
      .select()
    
    return { data, error }
  },

  // Get user's workouts - NOW FILTERS BY USER
  getUserWorkouts: async (limit = 50) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)  // FIX: Filter by current user
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },

  // Get user settings
  getUserSettings: async () => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    return { data, error }
  },

  // Update user settings
  updateUserSettings: async (settings) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    // Try to update first
    const { data: updateData, error: updateError } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', user.id)
      .select()
      .single()
    
    // If update failed because record doesn't exist, create it
    if (updateError && updateError.code === 'PGRST116') {
      const { data: insertData, error: insertError } = await supabase
        .from('user_settings')
        .insert([{
          user_id: user.id,
          ...settings
        }])
        .select()
        .single()
      
      return { data: insertData, error: insertError }
    }
    
    return { data: updateData, error: updateError }
  },

  // Update workout
  updateWorkout: async (workoutId, workoutData) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('workouts')
      .update({
        workout_type: workoutData.type,
        duration: workoutData.duration,
        rating: workoutData.rating,
        date: workoutData.date,
        distance: workoutData.distance,
        distance_unit: workoutData.distance_unit
      })
      .eq('id', workoutId)
      .eq('user_id', user.id) // Ensure user can only update their own workouts
      .select()
    
    return { data, error }
  },

  // Delete workout
  deleteWorkout: async (workoutId) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId)
      .eq('user_id', user.id) // Ensure user can only delete their own workouts
    
    return { data, error }
  },
  getWorkoutStats: async () => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)  // FIX: Filter by current user
    
    if (error) return { data: null, error }

    // Calculate stats from data
    const stats = {
      totalWorkouts: data.length,
      currentStreak: calculateStreak(data),
      weeklyCount: calculateWeeklyCount(data),
      weeklyDuration: calculateWeeklyDuration(data),
      averageRating: calculateAverageRating(data)
    }

    return { data: stats, error: null }
  },

  // EVENT AND GOAL MANAGEMENT
  
  // Create a new event
  createEvent: async (eventData) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{
        name: eventData.name,
        event_date: eventData.eventDate,
        goal: eventData.goal || null,
        created_by: user.id
      }])
      .select()
      .single()
    
    return { data, error }
  },

  // Update event
  updateEvent: async (eventId, eventData) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('events')
      .update({
        name: eventData.name,
        event_date: eventData.eventDate,
        goal: eventData.goal || null
      })
      .eq('id', eventId)
      .eq('created_by', user.id) // Ensure user can only update their own events
      .select()
    
    return { data, error }
  },

  // Delete event
  deleteEvent: async (eventId) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('created_by', user.id) // Ensure user can only delete their own events
    
    return { data, error }
  },
  getUserEvents: async () => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', user.id)
      .order('event_date', { ascending: true })
    
    return { data, error }
  },

  // Create a goal (athlete joins an event)
  createGoal: async (eventId, customTargetWorkouts = null) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    // Get user's weekly workout frequency
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('weekly_workout_frequency')
      .eq('user_id', user.id)
      .single()
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      return { data: null, error: settingsError }
    }

    const weeklyFrequency = settings?.weekly_workout_frequency || 4

    // Calculate target workouts if not provided
    let targetWorkouts = customTargetWorkouts
    if (!targetWorkouts) {
      // Get event date to calculate weeks remaining
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('event_date')
        .eq('id', eventId)
        .single()
      
      if (eventError) {
        return { data: null, error: eventError }
      }

      // Calculate weeks remaining
      const eventDate = new Date(event.event_date)
      const today = new Date()
      const weeksRemaining = Math.max(0.1, (eventDate - today) / (7 * 24 * 60 * 60 * 1000))
      targetWorkouts = Math.ceil(weeksRemaining * weeklyFrequency)
    }

    // Create the goal
    const { data, error } = await supabase
      .from('athlete_goals')
      .insert([{
        user_id: user.id,  // UPDATED: Use user_id instead of athlete_id
        event_id: eventId,
        target_workouts: targetWorkouts
      }])
      .select(`
        *,
        events!inner(name, event_date, goal)
      `)
      .single()
    
    return { data, error }
  },

  // Get user's active goals with banking progress
  getUserGoals: async () => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('User not authenticated') }
    }

    // Get goals with event information
    const { data: goals, error } = await supabase
      .from('athlete_goals')
      .select(`
        *,
        events!inner(name, event_date, goal)
      `)
      .eq('user_id', user.id)  // UPDATED: Use user_id instead of athlete_id
      .order('created_at', { ascending: false })
    
    if (error) {
      return { data: [], error }
    }

    // Calculate banking progress for each goal
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        // Count workouts since goal was created
        const { data: workouts, error: workoutError } = await supabase
          .from('workouts')
          .select('duration')
          .eq('user_id', user.id)
          .gte('date', goal.created_at.split('T')[0]) // Only count workouts after goal creation
        
        if (workoutError) {
          console.error('Error counting workouts for goal:', workoutError)
          return {
            ...goal,
            workouts_completed: 0,
            hours_completed: 0,
            days_remaining: 0
          }
        }

        const workoutsCompleted = workouts.length
        const hoursCompleted = workouts.reduce((sum, w) => sum + w.duration, 0) / 60
        
        // Calculate days remaining
        const eventDate = new Date(goal.events.event_date)
        const today = new Date()
        const daysRemaining = Math.max(0, Math.ceil((eventDate - today) / (24 * 60 * 60 * 1000)))
        
        return {
          ...goal,
          workouts_completed: workoutsCompleted,
          hours_completed: Math.round(hoursCompleted * 10) / 10,
          days_remaining: daysRemaining
        }
      })
    )

    return { data: goalsWithProgress, error: null }
  },

  // Delete a goal
  deleteGoal: async (goalId) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('athlete_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id) // UPDATED: Use user_id instead of athlete_id
    
    return { data, error }
  },

  // Update user's weekly workout frequency
  updateWeeklyFrequency: async (frequency) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        weekly_workout_frequency: frequency
      })
      .select()
      .single()
    
    return { data, error }
  },

  // Submit user feedback
  submitFeedback: async (feedbackData) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert([{
        user_id: user.id,
        message: feedbackData.message,
        user_email: user.email,
        page_context: feedbackData.page_context || 'unknown',
        user_agent: feedbackData.user_agent || 'unknown'
      }])
      .select()
    
    return { data, error }
  },

  // CUSTOM WORKOUT TYPES TABLE OPERATIONS
  
  // Get user's custom workout types from table
  getUserCustomWorkoutTypes: async () => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('custom_workout_types')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    
    return { data: data || [], error }
  },

  // Add custom workout type to table
  addCustomWorkoutType: async (typeName) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('custom_workout_types')
      .insert([{
        user_id: user.id,
        name: typeName.trim()
      }])
      .select()
      .single()
    
    return { data, error }
  },

  // Delete custom workout type from table
  deleteCustomWorkoutType: async (typeName) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('custom_workout_types')
      .delete()
      .eq('user_id', user.id)
      .eq('name', typeName)
    
    return { data, error }
  }
}

// Helper functions for stats calculation
function calculateStreak(workouts) {
  if (!workouts.length) return 0
  
  const today = new Date()
  const dates = workouts.map(w => new Date(w.date)).sort((a, b) => b - a)
  
  let streak = 0
  let currentDate = new Date(today)
  
  for (const workoutDate of dates) {
    const daysDiff = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === streak) {
      streak++
      currentDate = new Date(workoutDate)
    } else if (daysDiff > streak) {
      break
    }
  }
  
  return streak
}

function calculateWeeklyCount(workouts) {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  return workouts.filter(w => new Date(w.date) >= oneWeekAgo).length
}

function calculateWeeklyDuration(workouts) {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  return workouts
    .filter(w => new Date(w.date) >= oneWeekAgo)
    .reduce((total, w) => total + w.duration, 0)
}

function calculateAverageRating(workouts) {
  if (!workouts.length) return 0
  const total = workouts.reduce((sum, w) => sum + w.rating, 0)
  return Math.round((total / workouts.length) * 10) / 10
}

// Debug logging for exports
console.log('dbHelpers export debug:', {
  hasCreateWorkout: typeof dbHelpers.createWorkout,
  hasSubmitFeedback: typeof dbHelpers.submitFeedback,
  hasCreateEvent: typeof dbHelpers.createEvent,
  hasCreateGoal: typeof dbHelpers.createGoal,
  allMethods: Object.keys(dbHelpers)
});
