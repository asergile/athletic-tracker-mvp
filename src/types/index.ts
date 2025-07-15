// Core workout data types
export interface Workout {
  id: string
  user_id: string
  date: string
  duration_minutes: number
  distance_yards?: number
  workout_type: 'pool' | 'dryland' | 'weights'
  rating: 1 | 2 | 3 // Below Average / Average / Good
  notes?: string
  voice_transcript?: string
  processed_data?: ProcessedWorkoutData
  created_at: string
  updated_at: string
}

export interface ProcessedWorkoutData {
  sets: WorkoutSet[]
  stroke_distribution?: StrokeDistribution
  intensity_zones?: IntensityDistribution
  achievements?: string[]
  technical_focus?: string[]
}

export interface WorkoutSet {
  id: string
  type: 'warmup' | 'main' | 'cooldown' | 'drill'
  distance: number
  description: string
  repetitions?: number
  interval?: string
  rest?: string
  stroke?: 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'IM' | 'kick' | 'drill'
  intensity?: 'easy' | 'moderate' | 'hard' | 'sprint'
}

export interface StrokeDistribution {
  freestyle: number
  backstroke: number
  breaststroke: number
  butterfly: number
  IM: number
  kick: number
  drill: number
}

export interface IntensityDistribution {
  aerobic: number
  threshold: number
  sprint: number
}

// User and authentication types
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  sport: 'swimming' | 'track' | 'cycling' | 'triathlon'
  team_id?: string
  coach_id?: string
  created_at: string
}

export interface Team {
  id: string
  name: string
  sport: 'swimming' | 'track' | 'cycling' | 'triathlon'
  coach_id: string
  created_at: string
}

// Voice processing types
export interface VoiceRecording {
  id: string
  blob: Blob
  duration: number
  created_at: Date
}

export interface TranscriptionResult {
  text: string
  confidence: number
  processing_time: number
}

export interface WorkoutParsingResult {
  success: boolean
  workout_data?: ProcessedWorkoutData
  confidence: number
  errors?: string[]
  requires_review: boolean
}

// Analytics and dashboard types
export interface WeeklyStats {
  week_start: string
  total_distance: number
  total_duration: number
  workout_count: number
  average_rating: number
  attendance_rate: number
}

export interface MonthlyStats {
  month: string
  total_distance: number
  total_duration: number
  workout_count: number
  average_rating: number
  attendance_rate: number
  personal_records: number
}

// API response types
export interface APIResponse<T> {
  data?: T
  error?: string
  success: boolean
}
