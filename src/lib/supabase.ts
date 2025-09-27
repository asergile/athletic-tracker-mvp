import { createClient, SupabaseClient, AuthResponse, AuthTokenResponse, User, Session } from '@supabase/supabase-js'

// TypeScript interfaces for auth helper responses
interface AuthHelperResponse {
  data?: AuthResponse['data']
  error?: AuthResponse['error']
}

interface SessionResponse {
  session: Session | null
  error?: any
}

interface UserResponse {
  user: User | null
  error?: any
}

interface Workout {
  id: string
  workout_type: string
  duration: number
  rating: number
  date: string
  distance?: number
  distance_unit?: string
  created_at: string
}

// Supabase Configuration - Next.js environment variables
const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
  signInWithEmail: async (email: string, password: string): Promise<AuthHelperResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign up with email/password
  signUpWithEmail: async (email: string, password: string): Promise<AuthHelperResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  signOut: async (): Promise<{ error?: any }> => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current session
  getSession: async (): Promise<SessionResponse> => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Get current user
  getCurrentUser: async (): Promise<UserResponse> => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }
}

// Import enhanced database helpers with enterprise security
import { dbHelpers as enhancedDbHelpers } from './security/enhanced-db-helpers'

// Export enhanced database helpers (replaces original dbHelpers)
export const dbHelpers = enhancedDbHelpers

// Helper functions for stats calculation
function calculateStreak(workouts: Workout[]): number {
  if (!workouts.length) return 0
  
  const today = new Date()
  const dates = workouts.map(w => new Date(w.date)).sort((a, b) => b.getTime() - a.getTime())
  
  let streak = 0
  let currentDate = new Date(today)
  
  for (const workoutDate of dates) {
    const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === streak) {
      streak++
      currentDate = new Date(workoutDate)
    } else if (daysDiff > streak) {
      break
    }
  }
  
  return streak
}

function calculateWeeklyCount(workouts: Workout[]): number {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  return workouts.filter(w => new Date(w.date) >= oneWeekAgo).length
}

function calculateWeeklyDuration(workouts: Workout[]): number {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  return workouts
    .filter(w => new Date(w.date) >= oneWeekAgo)
    .reduce((total, w) => total + w.duration, 0)
}

function calculateAverageRating(workouts: Workout[]): number {
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
  hasGetUserProfile: typeof dbHelpers.getUserProfile,
  hasUpdateUserProfile: typeof dbHelpers.updateUserProfile,
  hasGetUserAuditHistory: typeof dbHelpers.getUserAuditHistory,
  hasCheckSuspiciousActivity: typeof dbHelpers.checkSuspiciousActivity,
  allMethods: Object.keys(dbHelpers)
});
