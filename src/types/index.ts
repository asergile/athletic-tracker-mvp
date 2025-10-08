/**
 * CENTRALIZED TYPE DEFINITIONS
 * Athletic Tracker MVP - All interfaces in one place
 * This eliminates interface conflicts and provides single source of truth
 */

// ===== DATABASE TYPES =====

export interface DatabaseResponse<T> {
  data: T | null
  error: Error | null
}

export interface DatabaseArrayResponse<T> {
  data: T[]
  error: Error | null
}

// ===== VOICE & ANALYSIS TYPES =====

export interface ProcessedWorkoutData {
  total_distance?: number
  average_pace?: number
  stroke_analysis?: StrokeDistribution
  segments?: WorkoutSegment[]
  performance_metrics?: PerformanceMetrics
  // Additional properties needed by WorkoutHistory
  sets?: any
  stroke_distribution?: any
  achievements?: any
  technical_focus?: any
}

export interface StrokeDistribution {
  freestyle?: number
  backstroke?: number
  breaststroke?: number
  butterfly?: number
}

export interface WorkoutSegment {
  distance: number
  time: number
  stroke_type?: string
  pace?: number
}

export interface PerformanceMetrics {
  total_strokes?: number
  average_stroke_rate?: number
  efficiency_score?: number
}

export interface WorkoutParsingResult {
  sets: WorkoutSet[]
  total_distance: number
  total_time: number
  workout_type: string
  notes?: string
  // Additional properties needed by WorkoutReview
  workout_data?: {
    sets: any
    stroke_distribution: any
    achievements: any
    technical_focus: any
  }
  success?: boolean
  confidence?: number
  transcript?: string
  recording_duration?: number
}

export interface WorkoutSet {
  id?: string  // Optional ID for frontend use
  distance: number
  time?: number
  stroke_type?: string
  rest_time?: number
  pace?: number
  description?: string
  // Additional properties needed by WorkoutReview
  type?: string      // Workout set type (warmup, main, cooldown, drill)
  stroke?: string    // Alternative to stroke_type
  interval?: string  // Interval description
}

// ===== CORE ENTITY TYPES =====

export interface Workout {
  id: string
  user_id: string
  workout_type: string
  duration: number
  rating: number
  date: string
  distance?: number
  distance_unit?: string
  created_at: string
  updated_at?: string
  // Voice analysis and processing fields
  voice_transcription?: string
  workout_analysis?: string
  processed_data?: ProcessedWorkoutData
  // Alternative field names for compatibility
  duration_minutes?: number  // Alternative to duration
  distance_yards?: number     // Alternative to distance for swimming
  notes?: string             // General notes field
}

export interface WorkoutData {
  workout_type: string  // ← REQUIRED FIELD
  duration: number
  rating: number
  date?: string
  distance?: number | null  // Allow null for form compatibility
  distance_unit?: string | null  // Allow null for form compatibility
}

export interface AppEvent {
  id: string
  name: string
  event_date: string
  goal?: string | null
  created_by: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  event_id: string
  target_workouts: number
  created_at: string
  events: AppEvent
  workouts_completed: number
  hours_completed: number
  days_remaining: number
}

export interface UserSettings {
  user_id?: string
  distance_unit_cardio: string
  distance_unit_swimming: string
  weekly_goal_minutes: number
  weekly_workout_frequency: number
  onboarding_completed?: boolean
  created_at?: string
  updated_at?: string
}

// ===== FORM DATA TYPES =====

export interface CurrentWorkout {
  type: string  // Maps to workout_type
  duration: string
  rating: number | null
  date: string
  distance: string
  distanceUnit: string
}

export interface EventFormData {
  name: string
  eventDate: string
  goal?: string
}

export interface GoalFormData {
  eventId: string
  targetWorkouts: number
}

// ===== UI COMPONENT TYPES =====

export interface WeeklyStats {
  count: number
  totalTime: number
  avgRating: number
}

export interface WeeklyGoalProgress {
  current: string
  goal: string
  percentage: number
}

export interface RatingConfig {
  label: string
  emoji: string
  color: string
}

export interface RatingLabels {
  [key: number]: RatingConfig
}

export interface DistanceUnits {
  cardio: string[]
  swimming: string[]
}

export type ViewType = 'log' | 'goals' | 'profile'

// ===== EVENT HANDLER TYPES =====

export type ChangeEventHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
export type ClickEventHandler = () => void

// ===== UTILITY TYPES =====

export interface SupabaseError {
  code?: string
  message?: string
}

export interface AuthUser {
  id: string
  email?: string
}

export interface AuthResponse {
  data: {
    user: AuthUser | null
  }
  error: SupabaseError | null
}

// ===== TYPE CONVERSION UTILITIES =====

/**
 * Converts CurrentWorkout (form data) to WorkoutData (database format)
 */
export function currentWorkoutToWorkoutData(currentWorkout: CurrentWorkout): WorkoutData {
  return {
    workout_type: currentWorkout.type,  // ← KEY MAPPING
    duration: parseInt(currentWorkout.duration.toString()),
    rating: currentWorkout.rating || 1,
    date: currentWorkout.date,
    distance: currentWorkout.distance ? parseFloat(currentWorkout.distance.toString()) : undefined,
    distance_unit: currentWorkout.distance ? currentWorkout.distanceUnit : undefined
  }
}
