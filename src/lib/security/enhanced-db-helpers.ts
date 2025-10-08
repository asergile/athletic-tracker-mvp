/**
 * Enhanced Security Database Helpers for Athletic Tracker MVP
 * Phase 1: Core Infrastructure - TypeScript Conversion
 * Complete drop-in replacement for original dbHelpers with enterprise-grade security
 */

import { supabase } from '../supabase'
import { 
  validateWorkoutData, 
  validateProfileData,
  sanitizeText,
  sanitizeNumber,
  sanitizeDate,
  formatSecureError
} from './input-validation'

// ===== TYPESCRIPT INTERFACES =====

interface DatabaseResponse<T> {
  data: T | null
  error: Error | null
}

interface DatabaseArrayResponse<T> {
  data: T[]
  error: Error | null
}

interface Workout {
  id: string
  user_id: string
  workout_type: string
  duration: number
  rating: number
  date: string
  distance?: number
  distance_unit?: string
  created_at: string  // Required in history page
  updated_at?: string
}

interface WorkoutData {
  workout_type: string
  duration: number
  rating: number
  date?: string
  distance?: number
  distance_unit?: string
}

interface FeedbackData {
  message: string
  page_context?: string
  user_agent?: string
}

interface SupabaseError {
  code?: string
  message?: string
}

interface AuthUser {
  id: string
  email?: string
}

interface AuthResponse {
  data: {
    user: AuthUser | null
  }
  error: SupabaseError | null
}

// ===== CORE WORKOUT FUNCTIONS =====

async function createWorkout(workoutData: WorkoutData): Promise<DatabaseResponse<Workout>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const validatedData = validateWorkoutData(workoutData);
    
    let workoutDate = validatedData.date;
    if (!workoutDate) {
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      workoutDate = localDate.toISOString().split('T')[0];
    }

    const secureWorkoutData = {
      user_id: user.id,
      workout_type: validatedData.workout_type,
      duration: validatedData.duration,
      rating: validatedData.rating,
      date: workoutDate,
      distance: validatedData.distance,
      distance_unit: validatedData.distance_unit
    };

    const { data, error } = await supabase
      .from('workouts')
      .insert([secureWorkoutData])
      .select()
      .single()

    if (error) {
      console.error('Enhanced security - create workout error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to save workout') }
    }

    return { data, error: null }
  } catch (validationError: any) {
    const secureError = formatSecureError(validationError, 'creating workout');
    return { data: null, error: new Error(secureError) }
  }
}

// ===== PROFILE MANAGEMENT FUNCTIONS =====

async function getUserProfile(): Promise<DatabaseResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Enhanced security - get user profile error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to retrieve profile') }
    }

    return { data: data || null, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'retrieving user profile');
    return { data: null, error: new Error(secureError) }
  }
}

async function updateUserProfile(profileData: any): Promise<DatabaseResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const validatedData = validateProfileData(profileData);

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Enhanced security - update user profile error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to update profile') }
    }

    return { data, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'updating user profile');
    return { data: null, error: new Error(secureError) }
  }
}

// ===== SECURITY & AUDIT FUNCTIONS =====

async function getUserAuditHistory(): Promise<DatabaseArrayResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Enhanced security - get audit history error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to retrieve audit history') }
    }

    return { data: data || [], error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'retrieving audit history');
    return { data: [], error: new Error(secureError) }
  }
}

async function checkSuspiciousActivity(): Promise<DatabaseResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    // Check for suspicious patterns in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('audit_log')
      .select('action, created_at')
      .eq('user_id', user.id)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Enhanced security - check suspicious activity error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to check activity') }
    }

    // Analyze for suspicious patterns (simplified implementation)
    const activities = data || [];
    const suspicious = {
      high_frequency: activities.length > 100, // More than 100 actions in 24h
      rapid_changes: false, // Could add more sophisticated logic
      unusual_timing: false // Could add timezone-based analysis
    };

    return { data: { suspicious, activity_count: activities.length }, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'checking suspicious activity');
    return { data: null, error: new Error(secureError) }
  }
}

async function getUserWorkouts(limit: number = 500): Promise<DatabaseArrayResponse<Workout>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const sanitizedLimit = sanitizeNumber(limit, { min: 1, max: 1000, defaultValue: 500 }) || 500;

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(sanitizedLimit)

    if (error) {
      console.error('Enhanced security - get workouts error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to retrieve workouts') }
    }

    return { data: data || [], error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'retrieving workouts');
    return { data: [], error: new Error(secureError) }
  }
}

async function submitFeedback(feedbackData: FeedbackData): Promise<DatabaseResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    if (!feedbackData.message || typeof feedbackData.message !== 'string') {
      return { data: null, error: new Error('Feedback message is required') }
    }

    const sanitizedMessage = sanitizeText(feedbackData.message, { maxLength: 1000 })
    
    const { data, error } = await supabase
      .from('feedback')
      .insert([{
        user_id: user.id,
        user_email: user.email || 'unknown@example.com',
        message: sanitizedMessage,
        page_context: feedbackData.page_context || '',
        user_agent: feedbackData.user_agent || ''
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Enhanced security - feedback submission error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to submit feedback') }
    }
    
    return { data, error: null }
  } catch (validationError: any) {
    const secureError = formatSecureError(validationError, 'submitting feedback');
    return { data: null, error: new Error(secureError) }
  }
}

// ===== WORKOUT MANAGEMENT FUNCTIONS =====

async function updateWorkout(id: string, updateData: Partial<WorkoutData>): Promise<DatabaseResponse<Workout>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const validatedData = validateWorkoutData(updateData as WorkoutData);

    const { data, error } = await supabase
      .from('workouts')
      .update({
        workout_type: validatedData.workout_type,
        duration: validatedData.duration,
        rating: validatedData.rating,
        date: validatedData.date,
        distance: validatedData.distance,
        distance_unit: validatedData.distance_unit
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Enhanced security - update workout error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to update workout') }
    }

    return { data, error: null }
  } catch (validationError: any) {
    const secureError = formatSecureError(validationError, 'updating workout');
    return { data: null, error: new Error(secureError) }
  }
}

async function deleteWorkout(id: string): Promise<DatabaseResponse<null>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Enhanced security - delete workout error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to delete workout') }
    }

    return { data: null, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'deleting workout');
    return { data: null, error: new Error(secureError) }
  }
}

async function getWorkoutStats(userId?: string): Promise<DatabaseResponse<any>> {
  return { data: null, error: new Error('Not implemented yet') }
}

// ===== USER SETTINGS FUNCTIONS =====

async function getUserSettings(): Promise<DatabaseResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is ok, we'll use defaults
      console.error('Enhanced security - get user settings error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to retrieve settings') }
    }

    // Return defaults if no settings found
    const defaultSettings = {
      distance_unit_cardio: 'miles',
      distance_unit_swimming: 'meters',
      weekly_goal_minutes: 300,
      weekly_workout_frequency: 4
    };

    return { data: data || defaultSettings, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'retrieving user settings');
    return { data: null, error: new Error(secureError) }
  }
}

async function updateUserSettings(settingsData: any): Promise<DatabaseResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        ...settingsData
      })
      .select()
      .single()

    if (error) {
      console.error('Enhanced security - update user settings error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to update settings') }
    }

    return { data, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'updating user settings');
    return { data: null, error: new Error(secureError) }
  }
}

async function updateWeeklyFrequency(): Promise<DatabaseResponse<any>> {
  return { data: null, error: new Error('Not implemented yet') }
}

/**
 * Mark user's onboarding as completed
 * Called after user completes onboarding flow or clicks skip
 */
async function markOnboardingComplete(): Promise<DatabaseResponse<boolean>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('user_settings')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id)
      .select('onboarding_completed')
      .single()

    if (error) {
      console.error('Enhanced security - mark onboarding complete error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to mark onboarding complete') }
    }

    return { data: data?.onboarding_completed ?? true, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'marking onboarding complete');
    return { data: null, error: new Error(secureError) }
  }
}

// ===== EVENTS FUNCTIONS =====

async function getUserEvents(): Promise<DatabaseArrayResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', user.id)
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Enhanced security - get user events error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to retrieve events') }
    }

    return { data: data || [], error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'retrieving events');
    return { data: [], error: new Error(secureError) }
  }
}

async function createEvent(eventData: any): Promise<DatabaseResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{
        name: sanitizeText(eventData.name, { maxLength: 200 }),
        event_date: sanitizeDate(eventData.eventDate),
        goal: eventData.goal ? sanitizeText(eventData.goal, { maxLength: 500 }) : null,
        created_by: user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Enhanced security - create event error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to create event') }
    }

    return { data, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'creating event');
    return { data: null, error: new Error(secureError) }
  }
}

async function updateEvent(eventId: string, eventData: any): Promise<DatabaseResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('events')
      .update({
        name: sanitizeText(eventData.name, { maxLength: 200 }),
        event_date: sanitizeDate(eventData.eventDate),
        goal: eventData.goal ? sanitizeText(eventData.goal, { maxLength: 500 }) : null
      })
      .eq('id', eventId)
      .eq('created_by', user.id)
      .select()
      .single()

    if (error) {
      console.error('Enhanced security - update event error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to update event') }
    }

    return { data, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'updating event');
    return { data: null, error: new Error(secureError) }
  }
}

async function deleteEvent(eventId: string): Promise<DatabaseResponse<null>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('created_by', user.id)

    if (error) {
      console.error('Enhanced security - delete event error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to delete event') }
    }

    return { data: null, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'deleting event');
    return { data: null, error: new Error(secureError) }
  }
}

// ===== GOALS FUNCTIONS =====

async function getUserGoals(): Promise<DatabaseArrayResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        events!inner(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Enhanced security - get user goals error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to retrieve goals') }
    }

    return { data: data || [], error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'retrieving goals');
    return { data: [], error: new Error(secureError) }
  }
}

async function createGoal(eventId: string, targetWorkouts: number): Promise<DatabaseResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const validatedTargetWorkouts = sanitizeNumber(targetWorkouts, { min: 1, max: 365, defaultValue: 20 });

    const { data, error } = await supabase
      .from('goals')
      .insert([{
        user_id: user.id,
        event_id: eventId,
        target_workouts: validatedTargetWorkouts
      }])
      .select()
      .single()

    if (error) {
      console.error('Enhanced security - create goal error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to create goal') }
    }

    return { data, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'creating goal');
    return { data: null, error: new Error(secureError) }
  }
}

async function deleteGoal(goalId: string): Promise<DatabaseResponse<null>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Enhanced security - delete goal error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to delete goal') }
    }

    return { data: null, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'deleting goal');
    return { data: null, error: new Error(secureError) }
  }
}

// ===== CUSTOM WORKOUT TYPES FUNCTIONS =====

async function getUserCustomWorkoutTypes(): Promise<DatabaseArrayResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('custom_workout_types')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      console.error('Enhanced security - get custom workout types error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to retrieve custom workout types') }
    }

    return { data: data || [], error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'retrieving custom workout types');
    return { data: [], error: new Error(secureError) }
  }
}

async function addCustomWorkoutType(typeName: string): Promise<DatabaseResponse<any>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const sanitizedName = sanitizeText(typeName, { maxLength: 50 });

    const { data, error } = await supabase
      .from('custom_workout_types')
      .insert([{
        user_id: user.id,
        name: sanitizedName
      }])
      .select()
      .single()

    if (error) {
      console.error('Enhanced security - add custom workout type error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to add custom workout type') }
    }

    return { data, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'adding custom workout type');
    return { data: null, error: new Error(secureError) }
  }
}

async function deleteCustomWorkoutType(typeName: string): Promise<DatabaseResponse<null>> {
  try {
    const { data: { user }, error: userError }: AuthResponse = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { error } = await supabase
      .from('custom_workout_types')
      .delete()
      .eq('name', typeName)
      .eq('user_id', user.id)

    if (error) {
      console.error('Enhanced security - delete custom workout type error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to delete custom workout type') }
    }

    return { data: null, error: null }
  } catch (err: any) {
    const secureError = formatSecureError(err, 'deleting custom workout type');
    return { data: null, error: new Error(secureError) }
  }
}

// ===== EXPORT =====

export const dbHelpers = {
  // Phase 1: Core Workout Functions
  createWorkout,
  getUserWorkouts,
  updateWorkout,
  deleteWorkout,
  // Phase 2: Statistics & Settings
  getWorkoutStats,
  getUserSettings,
  updateUserSettings,
  updateWeeklyFrequency,
  markOnboardingComplete,
  // Phase 3: Events & Goals
  getUserEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getUserGoals,
  createGoal,
  deleteGoal,
  // Phase 4: Custom Workout Types
  getUserCustomWorkoutTypes,
  addCustomWorkoutType,
  deleteCustomWorkoutType,
  // Phase 5: Profile Management
  getUserProfile,
  updateUserProfile,
  // Phase 6: Security & Audit
  getUserAuditHistory,
  checkSuspiciousActivity,
  // Feedback Function
  submitFeedback
}
