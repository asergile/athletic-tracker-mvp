import { supabase } from './supabase'

export interface Workout {
  id: string
  user_id: string
  workout_type: string
  duration: number
  rating: 1 | 2 | 3
  date: string
  distance?: number
  distance_unit?: string
  voice_transcription?: string
  workout_analysis?: any
  created_at: string
  updated_at: string
}

export async function getUserWorkouts(userId: string, limit = 10): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching workouts:', error)
    return []
  }

  return data || []
}

export async function createWorkout(workoutData: {
  user_id: string
  workout_type: string
  duration: number
  rating: 1 | 2 | 3
  date: string
  distance?: number
  distance_unit?: string
}): Promise<Workout | null> {
  const { data, error } = await supabase
    .from('workouts')
    .insert([workoutData])
    .select()
    .single()

  if (error) {
    console.error('Error creating workout:', error)
    return null
  }

  return data
}

export async function updateWorkout(workoutId: string, updates: Partial<Workout>): Promise<Workout | null> {
  const { data, error } = await supabase
    .from('workouts')
    .update(updates)
    .eq('id', workoutId)
    .select()
    .single()

  if (error) {
    console.error('Error updating workout:', error)
    return null
  }

  return data
}

export async function deleteWorkout(workoutId: string): Promise<boolean> {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)

  if (error) {
    console.error('Error deleting workout:', error)
    return false
  }

  return true
}
