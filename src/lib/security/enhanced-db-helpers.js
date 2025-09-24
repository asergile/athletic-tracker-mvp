/**
 * Enhanced Security Database Helpers for Athletic Tracker MVP
 * Complete drop-in replacement for original dbHelpers with enterprise-grade security
 */

import { supabase } from '../supabase.js'
import { 
  validateWorkoutData, 
  validateProfileData,
  sanitizeText,
  sanitizeNumber,
  sanitizeDate,
  formatSecureError
} from './input-validation.js'

async function getUserActivitySummary() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('user_activity_summary')
      .select('*')
      .eq('user_email', user.email)
    
    if (error) {
      console.error('Enhanced security - get user activity summary error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to load user activity summary') }
    }
    
    return { data: data || [], error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'loading user activity summary');
    return { data: [], error: new Error(secureError) }
  }
}

// Missing function for completeness
async function getRecentAuditActivity() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('recent_audit_activity')
      .select('*')
      .limit(20)
    
    if (error) {
      console.error('Enhanced security - get recent audit activity error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to load recent audit activity') }
    }
    
    return { data: data || [], error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'loading recent audit activity');
    return { data: [], error: new Error(secureError) }
  }
}

async function checkSuspiciousActivity() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .rpc('detect_suspicious_activity')
    
    if (error) {
      console.error('Enhanced security - suspicious activity check error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to check for suspicious activity') }
    }
    
    return { data: data || [], error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'checking suspicious activity');
    return { data: [], error: new Error(secureError) }
  }
}

async function getRecordAuditHistory(tableName, recordId) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const validatedTableName = sanitizeText(tableName, { maxLength: 50, minLength: 1 });
    if (!recordId || typeof recordId !== 'string') {
      return { data: [], error: new Error('Valid record ID is required') }
    }

    const { data, error } = await supabase
      .rpc('get_record_audit_history', {
        p_table_name: validatedTableName,
        p_record_id: recordId
      })
    
    if (error) {
      console.error('Enhanced security - get record audit error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to load record audit history') }
    }
    
    return { data: data || [], error: null }
  } catch (validationError) {
    const secureError = formatSecureError(validationError, 'loading record audit history');
    return { data: [], error: new Error(secureError) }
  }
}

async function getUserAuditHistory(limit = 50) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(safeLimit)
    
    if (error) {
      console.error('Enhanced security - get audit history error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to load audit history') }
    }
    
    return { data: data || [], error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'loading audit history');
    return { data: [], error: new Error(secureError) }
  }
}

async function getUserWorkoutsWithProfile(limit = 50) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);

    const { data: workouts, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(safeLimit)
    
    if (workoutError) {
      console.error('Enhanced security - get workouts with profile error:', {
        code: workoutError.code,
        userId: user.id,
        message: workoutError.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to load workouts') }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      return { data: workouts || [], error: null }
    }

    const workoutsWithProfile = (workouts || []).map(workout => ({
      ...workout,
      profiles: profile
    }))
    
    return { data: workoutsWithProfile, error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'loading workouts with profile');
    return { data: [], error: new Error(secureError) }
  }
}

async function updateUserProfile(updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: new Error('Authentication required') }
    }

    // Enhanced input validation - only allow safe fields
    const validatedData = validateProfileData(updates);

    if (Object.keys(validatedData).length === 0) {
      return { data: null, error: new Error('No valid profile data provided') }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(validatedData)
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) {
      console.error('Enhanced security - profile update error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to update profile') }
    }
    
    return { data, error: null }
  } catch (validationError) {
    const secureError = formatSecureError(validationError, 'profile update');
    return { data: null, error: new Error(secureError) }
  }
}

async function getUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('Enhanced security - profile load error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to load profile') }
    }
    
    return { data, error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'profile loading');
    return { data: null, error: new Error(secureError) }
  }
}

async function deleteCustomWorkoutType(typeName) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    if (!typeName || typeof typeName !== 'string') {
      return { data: null, error: new Error('Valid type name is required') }
    }

    const sanitizedName = sanitizeText(typeName, { maxLength: 50 });

    const { data, error } = await supabase
      .from('custom_workout_types')
      .delete()
      .eq('user_id', user.id)
      .eq('name', sanitizedName)
    
    if (error) {
      console.error('Enhanced security - delete custom type error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to delete custom workout type') }
    }
    
    return { data: null, error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'deleting custom workout type');
    return { data: null, error: new Error(secureError) }
  }
}

async function addCustomWorkoutType(typeName) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const validatedName = sanitizeText(typeName, { 
      maxLength: 50, 
      minLength: 1 
    });

    // Check for duplicates
    const { data: existing } = await supabase
      .from('custom_workout_types')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', validatedName)
      .single()
    
    if (existing) {
      return { data: null, error: new Error('Workout type already exists') }
    }

    const { data, error } = await supabase
      .from('custom_workout_types')
      .insert([{
        user_id: user.id,
        name: validatedName
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Enhanced security - add custom type error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to add custom workout type') }
    }
    
    return { data, error: null }
  } catch (validationError) {
    const secureError = formatSecureError(validationError, 'adding custom workout type');
    return { data: null, error: new Error(secureError) }
  }
}

async function getUserCustomWorkoutTypes() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('custom_workout_types')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    
    if (error) {
      console.error('Enhanced security - get custom types error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to load custom workout types') }
    }
    
    return { data: data || [], error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'loading custom workout types');
    return { data: [], error: new Error(secureError) }
  }
}

async function submitFeedback(feedbackData) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const validatedData = {
      user_id: user.id,
      message: sanitizeText(feedbackData.message, { 
        maxLength: 2000, 
        minLength: 5,
        allowNewlines: true 
      }),
      user_email: user.email,
      page_context: sanitizeText(feedbackData.page_context || 'unknown', { maxLength: 100 }),
      user_agent: sanitizeText(feedbackData.user_agent || 'unknown', { maxLength: 500 })
    };

    const { data, error } = await supabase
      .from('feedback')
      .insert([validatedData])
      .select()
    
    if (error) {
      console.error('Enhanced security - feedback submit error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to submit feedback') }
    }
    
    return { data, error: null }
  } catch (validationError) {
    const secureError = formatSecureError(validationError, 'feedback submission');
    return { data: null, error: new Error(secureError) }
  }
}

async function deleteGoal(goalId) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    if (!goalId || typeof goalId !== 'string') {
      return { data: null, error: new Error('Valid goal ID is required') }
    }

    const { data, error } = await supabase
      .from('athlete_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Enhanced security - goal delete error:', {
        code: error.code,
        goalId,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to delete goal') }
    }
    
    return { data: null, error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'goal deletion');
    return { data: null, error: new Error(secureError) }
  }
}

async function getUserGoals() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    // Get goals with event information
    const { data: goals, error } = await supabase
      .from('athlete_goals')
      .select(`
        *,
        events!inner(name, event_date, goal)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Enhanced security - get goals error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to load goals') }
    }

    // Calculate banking progress for each goal
    const goalsWithProgress = await Promise.all(
      (goals || []).map(async (goal) => {
        try {
          // Count workouts since goal was created
          const { data: workouts, error: workoutError } = await supabase
            .from('workouts')
            .select('duration')
            .eq('user_id', user.id)
            .gte('date', goal.created_at.split('T')[0])
          
          if (workoutError) {
            console.error('Enhanced security - workout count for goal:', {
              goalId: goal.id,
              code: workoutError.code
            });
            return {
              ...goal,
              workouts_completed: 0,
              hours_completed: 0,
              days_remaining: 0
            }
          }

          const workoutsCompleted = workouts?.length || 0
          const hoursCompleted = workouts?.reduce((sum, w) => sum + (w.duration || 0), 0) / 60 || 0
          
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
        } catch (goalError) {
          console.error('Enhanced security - goal processing error:', goalError);
          return {
            ...goal,
            workouts_completed: 0,
            hours_completed: 0,
            days_remaining: 0
          }
        }
      })
    )

    return { data: goalsWithProgress, error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'loading goals');
    return { data: [], error: new Error(secureError) }
  }
}

async function createGoal(eventId, customTargetWorkouts = null) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    if (!eventId || typeof eventId !== 'string') {
      return { data: null, error: new Error('Valid event ID is required') }
    }

    // Get user's weekly workout frequency
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('weekly_workout_frequency')
      .eq('user_id', user.id)
      .single()
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Enhanced security - settings load for goal:', {
        code: settingsError.code,
        userId: user.id,
        message: settingsError.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to load user settings') }
    }

    const weeklyFrequency = settings?.weekly_workout_frequency || 4

    // Calculate target workouts if not provided
    let targetWorkouts = customTargetWorkouts
    if (!targetWorkouts) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('event_date')
        .eq('id', eventId)
        .single()
      
      if (eventError) {
        console.error('Enhanced security - event load for goal:', {
          code: eventError.code,
          eventId,
          userId: user.id,
          message: eventError.message?.substring(0, 100)
        });
        return { data: null, error: new Error('Unable to load event details') }
      }

      const eventDate = new Date(event.event_date)
      const today = new Date()
      const weeksRemaining = Math.max(0.1, (eventDate - today) / (7 * 24 * 60 * 60 * 1000))
      targetWorkouts = Math.ceil(weeksRemaining * weeklyFrequency)
    }

    // Validate target workouts
    targetWorkouts = sanitizeNumber(targetWorkouts, {
      min: 1,
      max: 365,
      integer: true,
      required: true
    });

    const { data, error } = await supabase
      .from('athlete_goals')
      .insert([{
        user_id: user.id,
        event_id: eventId,
        target_workouts: targetWorkouts
      }])
      .select(`
        *,
        events!inner(name, event_date, goal)
      `)
      .single()
    
    if (error) {
      console.error('Enhanced security - goal creation error:', {
        code: error.code,
        eventId,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to create goal') }
    }
    
    return { data, error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'goal creation');
    return { data: null, error: new Error(secureError) }
  }
}

async function getUserEvents() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', user.id)
      .order('event_date', { ascending: true })
    
    if (error) {
      console.error('Enhanced security - get events error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to load events') }
    }
    
    return { data: data || [], error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'loading events');
    return { data: [], error: new Error(secureError) }
  }
}

async function deleteEvent(eventId) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    if (!eventId || typeof eventId !== 'string') {
      return { data: null, error: new Error('Valid event ID is required') }
    }

    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('created_by', user.id)
    
    if (error) {
      console.error('Enhanced security - event delete error:', {
        code: error.code,
        eventId,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to delete event') }
    }
    
    return { data: null, error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'event deletion');
    return { data: null, error: new Error(secureError) }
  }
}

async function updateEvent(eventId, eventData) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    if (!eventId || typeof eventId !== 'string') {
      return { data: null, error: new Error('Valid event ID is required') }
    }

    const validatedData = {
      name: sanitizeText(eventData.name, { maxLength: 100, minLength: 1 }),
      event_date: sanitizeDate(eventData.eventDate || eventData.event_date, { 
        required: true,
        minDate: new Date().toISOString().split('T')[0]
      }),
      goal: eventData.goal ? sanitizeText(eventData.goal, { maxLength: 500 }) : null
    };

    const { data, error } = await supabase
      .from('events')
      .update(validatedData)
      .eq('id', eventId)
      .eq('created_by', user.id)
      .select()
    
    if (error) {
      console.error('Enhanced security - event update error:', {
        code: error.code,
        eventId,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to update event') }
    }
    
    if (!data || data.length === 0) {
      return { data: null, error: new Error('Event not found or access denied') }
    }
    
    return { data, error: null }
  } catch (validationError) {
    const secureError = formatSecureError(validationError, 'event update');
    return { data: null, error: new Error(secureError) }
  }
}

async function createEvent(eventData) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const validatedData = {
      name: sanitizeText(eventData.name, { maxLength: 100, minLength: 1 }),
      event_date: sanitizeDate(eventData.eventDate || eventData.event_date, { 
        required: true,
        minDate: new Date().toISOString().split('T')[0]
      }),
      goal: eventData.goal ? sanitizeText(eventData.goal, { maxLength: 500 }) : null,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('events')
      .insert([validatedData])
      .select()
      .single()
    
    if (error) {
      console.error('Enhanced security - event creation error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to create event') }
    }
    
    return { data, error: null }
  } catch (validationError) {
    const secureError = formatSecureError(validationError, 'event creation');
    return { data: null, error: new Error(secureError) }
  }
}

async function updateWeeklyFrequency(frequency) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const validatedFrequency = sanitizeNumber(frequency, {
      min: 1,
      max: 14,
      integer: true,
      required: true
    });

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        weekly_workout_frequency: validatedFrequency
      })
      .select()
      .single()
    
    if (error) {
      console.error('Enhanced security - frequency update error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to update frequency') }
    }
    
    return { data, error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'frequency update');
    return { data: null, error: new Error(secureError) }
  }
}

async function updateUserSettings(settings) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const validatedSettings = {};
    
    if (settings.weekly_goal_minutes !== undefined) {
      validatedSettings.weekly_goal_minutes = sanitizeNumber(settings.weekly_goal_minutes, {
        min: 60,
        max: 5040, // 84 hours max per week
        integer: true,
        required: false
      }) || 300;
    }
    
    if (settings.distance_unit_cardio !== undefined) {
      if (['miles', 'kilometers'].includes(settings.distance_unit_cardio)) {
        validatedSettings.distance_unit_cardio = settings.distance_unit_cardio;
      }
    }
    
    if (settings.distance_unit_swimming !== undefined) {
      if (['meters', 'yards'].includes(settings.distance_unit_swimming)) {
        validatedSettings.distance_unit_swimming = settings.distance_unit_swimming;
      }
    }

    if (settings.weekly_workout_frequency !== undefined) {
      validatedSettings.weekly_workout_frequency = sanitizeNumber(settings.weekly_workout_frequency, {
        min: 1,
        max: 14,
        integer: true,
        required: false
      }) || 4;
    }

    // Try to update first
    const { data: updateData, error: updateError } = await supabase
      .from('user_settings')
      .update(validatedSettings)
      .eq('user_id', user.id)
      .select()
      .single()
    
    // If update failed because record doesn't exist, create it
    if (updateError && updateError.code === 'PGRST116') {
      const { data: insertData, error: insertError } = await supabase
        .from('user_settings')
        .insert([{
          user_id: user.id,
          ...validatedSettings
        }])
        .select()
        .single()
      
      return { data: insertData, error: insertError }
    }
    
    if (updateError) {
      console.error('Enhanced security - settings update error:', {
        code: updateError.code,
        userId: user.id,
        message: updateError.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to update settings') }
    }
    
    return { data: updateData, error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'updating settings');
    return { data: null, error: new Error(secureError) }
  }
}

async function getUserSettings() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Enhanced security - get settings error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to load settings') }
    }
    
    return { data, error }
  } catch (err) {
    const secureError = formatSecureError(err, 'loading settings');
    return { data: null, error: new Error(secureError) }
  }
}

async function getWorkoutStats() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Enhanced security - get workout stats error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to load workout statistics') }
    }

    const stats = {
      totalWorkouts: data?.length || 0,
      currentStreak: calculateStreak(data || []),
      weeklyCount: calculateWeeklyCount(data || []),
      weeklyDuration: calculateWeeklyDuration(data || []),
      averageRating: calculateAverageRating(data || [])
    }

    return { data: stats, error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'loading statistics');
    return { data: null, error: new Error(secureError) }
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
    .reduce((total, w) => total + (w.duration || 0), 0)
}

function calculateAverageRating(workouts) {
  if (!workouts.length) return 0
  const total = workouts.reduce((sum, w) => sum + (w.rating || 0), 0)
  return Math.round((total / workouts.length) * 10) / 10
}

async function deleteWorkout(workoutId) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    if (!workoutId || typeof workoutId !== 'string') {
      return { data: null, error: new Error('Valid workout ID is required') }
    }

    const { data, error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Enhanced security - workout delete error:', {
        code: error.code,
        workoutId,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to delete workout') }
    }
    
    return { data: null, error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'workout deletion');
    return { data: null, error: new Error(secureError) }
  }
}

async function updateWorkout(workoutId, workoutData) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required') }
    }

    if (!workoutId || typeof workoutId !== 'string') {
      return { data: null, error: new Error('Valid workout ID is required') }
    }

    const validatedData = validateWorkoutData(workoutData);
    
    const updateData = {
      workout_type: validatedData.workout_type,
      duration: validatedData.duration,
      rating: validatedData.rating,
      date: validatedData.date,
      distance: validatedData.distance,
      distance_unit: validatedData.distance_unit
    };

    const { data, error } = await supabase
      .from('workouts')
      .update(updateData)
      .eq('id', workoutId)
      .eq('user_id', user.id)
      .select()
    
    if (error) {
      console.error('Enhanced security - workout update error:', {
        code: error.code,
        workoutId,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to update workout') }
    }
    
    if (!data || data.length === 0) {
      return { data: null, error: new Error('Workout not found or access denied') }
    }
    
    return { data, error: null }
  } catch (validationError) {
    const secureError = formatSecureError(validationError, 'workout update');
    return { data: null, error: new Error(secureError) }
  }
}

// ===== CORE WORKOUT FUNCTIONS =====

async function createWorkout(workoutData) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
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
    
    if (error) {
      console.error('Enhanced security - workout creation error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: null, error: new Error('Unable to save workout') }
    }
    
    return { data, error: null }
  } catch (validationError) {
    const secureError = formatSecureError(validationError, 'workout creation');
    return { data: null, error: new Error(secureError) }
  }
}

async function getUserWorkouts(limit = 50) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: [], error: new Error('Authentication required') }
    }

    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(safeLimit)
    
    if (error) {
      console.error('Enhanced security - get workouts error:', {
        code: error.code,
        userId: user.id,
        message: error.message?.substring(0, 100)
      });
      return { data: [], error: new Error('Unable to load workouts') }
    }
    
    return { data: data || [], error: null }
  } catch (err) {
    const secureError = formatSecureError(err, 'loading workouts');
    return { data: [], error: new Error(secureError) }
  }
}

// ===== FIRST BATCH COMPLETE =====

export const dbHelpers = {
  createWorkout,
  getUserWorkouts,
  updateWorkout,
  deleteWorkout,
  getWorkoutStats,
  getUserSettings,
  updateUserSettings,
  updateWeeklyFrequency,
  createEvent,
  updateEvent,
  deleteEvent,
  getUserEvents,
  createGoal,
  getUserGoals,
  deleteGoal,
  submitFeedback,
  getUserCustomWorkoutTypes,
  addCustomWorkoutType,
  deleteCustomWorkoutType,
  getUserProfile,
  updateUserProfile,
  getUserWorkoutsWithProfile,
  getUserAuditHistory,
  getRecordAuditHistory,
  checkSuspiciousActivity,
  getRecentAuditActivity,
  getUserActivitySummary
}
