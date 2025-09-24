// Updated Secure Database Functions for Athletic Tracker
// After implementing profiles table, use these patterns in your app

import { supabase } from './supabase'

// ✅ Get user workouts with profile information
export async function getUserWorkoutsWithProfile() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Authentication required')
  }

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id,
      workout_type,
      duration,
      rating,
      date,
      created_at,
      profiles!inner(email, display_name)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    console.error('Database error:', error)
    throw new Error('Unable to load workouts')
  }

  return data
}

// ✅ Get user profile
export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Profile error:', error)
    throw new Error('Unable to load profile')
  }

  return data
}

// ✅ Update user profile
export async function updateUserProfile(updates: {
  display_name?: string
  avatar_url?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()

  if (error) {
    console.error('Profile update error:', error)
    throw new Error('Unable to update profile')
  }

  return data[0]
}

// ✅ Get workout statistics with user info
export async function getWorkoutStats() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      workout_type,
      duration,
      rating,
      date,
      profiles!inner(display_name)
    `)
    .eq('user_id', user.id)

  if (error) {
    console.error('Stats error:', error)
    throw new Error('Unable to load workout statistics')
  }

  // Calculate stats
  const totalWorkouts = data.length
  const totalDuration = data.reduce((sum, workout) => sum + workout.duration, 0)
  const averageRating = data.reduce((sum, workout) => sum + workout.rating, 0) / totalWorkouts || 0

  return {
    totalWorkouts,
    totalDuration,
    averageRating: Math.round(averageRating * 10) / 10,
    userName: data[0]?.profiles?.display_name || 'User'
  }
}