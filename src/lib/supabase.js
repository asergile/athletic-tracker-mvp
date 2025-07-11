import { createClient } from '@supabase/supabase-js'

// Supabase Configuration
// Note: These values need to be set in your environment or replaced with actual values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

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
  // Sign in with Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  },

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
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
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
  // Create workout
  createWorkout: async (workoutData) => {
    const { data, error } = await supabase
      .from('workouts')
      .insert([{
        workout_type: workoutData.type,
        duration: workoutData.duration,
        rating: workoutData.rating,
        date: workoutData.date || new Date().toISOString().split('T')[0]
      }])
      .select()
    
    return { data, error }
  },

  // Get user's workouts
  getUserWorkouts: async (limit = 50) => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },

  // Get workout stats
  getWorkoutStats: async () => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
    
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