// TEMPORARY TEST FILE - Enhanced Integration Test
// This replaces just createWorkout to test enhanced security

import { createClient } from '@supabase/supabase-js'

// Import enhanced createWorkout function for testing
import { dbHelpers as enhancedHelpers } from './security/enhanced-db-helpers'

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
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Auth helper functions (unchanged)
export const authHelpers = {
  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },
  signUpWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    return { data, error }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }
}

// TEST: Use enhanced createWorkout, keep others unchanged for now
export const dbHelpers = {
  // ENHANCED - Test the security features
  createWorkout: enhancedHelpers.createWorkout,
  
  // ORIGINAL - Keep these for now until full integration
  getUserWorkouts: async (limit = 50) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },
  
  // Keep all other functions the same for now...
  getUserSettings: async () => {
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
  
  updateUserSettings: async (settings) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data: updateData, error: updateError } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', user.id)
      .select()
      .single()
    
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
  }
}

console.log('Enhanced createWorkout integration test ready!')
