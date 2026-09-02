'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, Flag } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import AuthScreen from '@/components/AuthScreen'
import LoadingScreen from '@/components/LoadingScreen'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'
import FeedbackButton from '@/components/FeedbackButton'
import StandardNavigation from '@/components/StandardNavigation'

// TypeScript Interfaces
interface UserSettings {
  distance_unit_cardio: string;
  distance_unit_swimming: string;
  weekly_goal_minutes: number;
  weekly_workout_frequency: number;
}

interface AppEvent {
  id: string;
  name: string;
  event_date: string;
  goal?: string | null;
  created_by: string;
  created_at: string;
  is_archived?: boolean;
}

interface Goal {
  id: string;
  user_id: string;
  event_id: string;
  target_workouts: number;
  created_at: string;
  events: AppEvent;
  workouts_completed: number;
  hours_completed: number;
  days_remaining: number;
}

interface EventFormData {
  name: string;
  eventDate: string;
  goal?: string;
}

interface GoalFormData {
  eventId: string;
  targetWorkouts: number;
}

export default function GoalsPage(): React.ReactElement {
  const { user, loading, isHydrated } = useAuth()
  const router = useRouter()
  
  // State
  const [userSettings, setUserSettings] = useState<UserSettings>({
    distance_unit_cardio: 'miles',
    distance_unit_swimming: 'meters',
    weekly_goal_minutes: 300,
    weekly_workout_frequency: 4
  })
  
  const [events, setEvents] = useState<AppEvent[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [showArchived, setShowArchived] = useState<boolean>(false)
  
  // Goals-specific state
  const [showCreateEvent, setShowCreateEvent] = useState<boolean>(false)
  const [showCreateGoal, setShowCreateGoal] = useState<boolean>(false)
  const [selectedEventForGoal, setSelectedEventForGoal] = useState<string>('')
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  
  // Form data state
  const [eventForm, setEventForm] = useState<EventFormData>({
    name: '',
    eventDate: '',
    goal: ''
  })
  
  const [goalForm, setGoalForm] = useState<GoalFormData>({
    eventId: '',
    targetWorkouts: 0
  })
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Load data
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  // Reload when showArchived changes
  useEffect(() => {
    if (user && !isLoading) {
      loadUserData()
    }
  }, [showArchived])

  const loadUserData = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const [settingsResponse, eventsResponse, goalsResponse] = await Promise.all([
        dbHelpers.getUserSettings(),
        dbHelpers.getUserEvents(showArchived), // Pass showArchived flag
        dbHelpers.getUserGoals()
      ])

      if (settingsResponse.data) {
        setUserSettings(settingsResponse.data)
      }
      
      if (eventsResponse.data) {
        setEvents(eventsResponse.data)
      }
      
      if (goalsResponse.data) {
        setGoals(goalsResponse.data)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setError('Failed to load your data. Please refresh the page.')
    } finally {
      setIsLoading(false)
    }
  }

  // Form handlers
  const handleEventFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEventForm(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleGoalFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGoalForm(prev => ({ 
      ...prev, 
      [name]: name === 'targetWorkouts' ? parseInt(value) || 0 : value 
    }))
  }, [])

  const handleCreateEvent = useCallback(async (): Promise<void> => {
    if (!eventForm.name || !eventForm.eventDate) {
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await dbHelpers.createEvent(eventForm)
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      // Reload events
      const eventsResponse = await dbHelpers.getUserEvents()
      if (eventsResponse.data) {
        setEvents(eventsResponse.data)
      }
      
      setEventForm({ name: '', eventDate: '', goal: '' })
      setShowCreateEvent(false)
    } catch (error) {
      console.error('Error creating event:', error)
      setError('Failed to create event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [eventForm])

  const handleUpdateEvent = useCallback(async (): Promise<void> => {
    if (!editingEvent || !eventForm.name || !eventForm.eventDate) {
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await dbHelpers.updateEvent(editingEvent.id, eventForm)
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      // Reload events
      const eventsResponse = await dbHelpers.getUserEvents()
      if (eventsResponse.data) {
        setEvents(eventsResponse.data)
      }
      
      setEventForm({ name: '', eventDate: '', goal: '' })
      setEditingEvent(null)
    } catch (error) {
      console.error('Error updating event:', error)
      setError('Failed to update event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [editingEvent, eventForm])

  const handleCreateGoal = useCallback(async (): Promise<void> => {
    if (!goalForm.eventId || goalForm.targetWorkouts <= 0) {
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await dbHelpers.createGoal(goalForm.eventId, goalForm.targetWorkouts)
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      // Reload goals
      const goalsResponse = await dbHelpers.getUserGoals()
      if (goalsResponse.data) {
        setGoals(goalsResponse.data)
      }
      
      setGoalForm({ eventId: '', targetWorkouts: 0 })
      setShowCreateGoal(false)
      setSelectedEventForGoal('')
    } catch (error) {
    console.error('Error creating goal:', error)
    setError('Failed to create training goal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [goalForm])

  const handleUpdateGoal = useCallback(async (): Promise<void> => {
    if (!editingGoal || goalForm.targetWorkouts <= 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await dbHelpers.updateGoal(editingGoal.id, goalForm.targetWorkouts)
      if (response.error) {
        throw new Error(response.error.message)
      }

      // Reload goals
      const goalsResponse = await dbHelpers.getUserGoals()
      if (goalsResponse.data) {
        setGoals(goalsResponse.data)
      }

      setGoalForm({ eventId: '', targetWorkouts: 0 })
      setShowCreateGoal(false)
      setSelectedEventForGoal('')
      setEditingGoal(null)
    } catch (error) {
      console.error('Error updating goal:', error)
      setError('Failed to update training goal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [editingGoal, goalForm])

  const handleArchiveEvent = useCallback(async (eventId: string, isArchived: boolean): Promise<void> => {
    try {
      const response = isArchived 
        ? await dbHelpers.unarchiveEvent(eventId)
        : await dbHelpers.archiveEvent(eventId)
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      // Reload events
      const eventsResponse = await dbHelpers.getUserEvents(showArchived)
      if (eventsResponse.data) {
        setEvents(eventsResponse.data)
      }
    } catch (error) {
      console.error('Error archiving event:', error)
      setError('Failed to archive event. Please try again.')
    }
  }, [showArchived])

  const handleDeleteEvent = useCallback(async (eventId: string): Promise<void> => {
    if (window.confirm('Permanently delete this event? This will also delete any associated training goals. This cannot be undone.')) {
      try {
        const response = await dbHelpers.deleteEvent(eventId)
        if (response.error) {
          throw new Error(response.error.message)
        }
        
        // Reload both events and goals (cascade delete)
        const [eventsResponse, goalsResponse] = await Promise.all([
          dbHelpers.getUserEvents(showArchived),
          dbHelpers.getUserGoals()
        ])
        
        if (eventsResponse.data) {
          setEvents(eventsResponse.data)
        }
        
        if (goalsResponse.data) {
          setGoals(goalsResponse.data)
        }
      } catch (error) {
        console.error('Error deleting event:', error)
        setError('Failed to delete event. Please try again.')
      }
    }
  }, [showArchived])

  const handleDeleteGoal = useCallback(async (goalId: string): Promise<void> => {
    if (window.confirm('Delete this training goal? This will remove your workout target, but the event will remain.')) {
      try {
        const response = await dbHelpers.deleteGoal(goalId)
        if (response.error) {
          throw new Error(response.error.message)
        }
        
        // Reload goals
        const goalsResponse = await dbHelpers.getUserGoals()
        if (goalsResponse.data) {
          setGoals(goalsResponse.data)
        }
      } catch (error) {
        console.error('Error deleting goal:', error)
        setError('Failed to delete training goal. Please try again.')
      }
    }
  }, [])

  const handleEditEvent = useCallback((event: AppEvent): void => {
    setEditingEvent(event)
    setEventForm({
      name: event.name,
      eventDate: event.event_date,
      goal: event.goal || ''
    })
  }, [])

  const handleCreateGoalForEvent = useCallback((eventId: string): void => {
    setSelectedEventForGoal(eventId)
    setGoalForm(prev => ({ ...prev, eventId }))
    setShowCreateGoal(true)
  }, [])

  const handleEditGoal = useCallback((goal: Goal): void => {
    setEditingGoal(goal)
    setSelectedEventForGoal(goal.event_id)
    setGoalForm({ eventId: goal.event_id, targetWorkouts: goal.target_workouts })
    setShowCreateGoal(true)
  }, [])

  const resetForms = useCallback((): void => {
    setEventForm({ name: '', eventDate: '', goal: '' })
    setGoalForm({ eventId: '', targetWorkouts: 0 })
    setEditingEvent(null)
    setEditingGoal(null)
    setShowCreateEvent(false)
    setShowCreateGoal(false)
    setSelectedEventForGoal('')
  }, [])

  // Calculate target workouts for goal form
  const calculateTargetWorkouts = useCallback((eventDate: string): number => {
    const today = new Date()
    const event = new Date(eventDate)
    const weeksRemaining = Math.max(0.1, (event.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const weeklyFrequency = userSettings?.weekly_workout_frequency || 4
    return Math.ceil(weeksRemaining * weeklyFrequency)
  }, [userSettings?.weekly_workout_frequency])

  if (loading || isLoading || !isHydrated) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Goals & Events</h1>
            <p className="text-green-200">Train toward concrete goals</p>
          </div>
          <StandardNavigation 
            currentPage="goals" 
            onNavigate={(view: string) => {
              if (view === 'log') {
                router.push('/')
              } else if (view === 'profile') {
                router.push('/profile')
              } else if (view === 'weekly') {
                router.push('/weekly-view')
              } else if (view === 'history') {
                router.push('/history')
              }
            }} 
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 mb-4">
          <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-xl p-4">
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-8">
        {/* Create Event Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateEvent(true)}
            className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create New Event</span>
            </div>
          </button>
        </div>

        {/* Events Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="px-4 py-2 rounded-lg bg-white bg-opacity-10 text-white hover:bg-opacity-20 transition-colors text-sm font-medium"
            >
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </button>
          </div>
          {events.length === 0 ? (
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Calendar className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white mb-2">No events created yet</p>
              <p className="text-green-200 text-sm">Create your first training event to start banking workouts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event: AppEvent) => {
                const eventGoal = goals.find(g => g.event_id === event.id)
                
                // Calculate days difference (can be negative for past events)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const eventDate = new Date(event.event_date)
                eventDate.setHours(0, 0, 0, 0)
                const daysDiff = Math.ceil((eventDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
                
                const isPastEvent = daysDiff < 0
                const isToday = daysDiff === 0
                const daysRemaining = Math.abs(daysDiff)
                
                // Generate appropriate time text
                let timeText = ''
                if (isToday) {
                  timeText = 'Today!'
                } else if (isPastEvent) {
                  if (daysRemaining === 1) {
                    timeText = 'Yesterday'
                  } else {
                    timeText = `${daysRemaining} days ago`
                  }
                } else {
                  if (daysRemaining === 1) {
                    timeText = '1 day away'
                  } else {
                    timeText = `${daysRemaining} days away`
                  }
                }
                
                const isArchived = (event as any).is_archived || false
                
                return (
                  <div key={event.id} className={`bg-white rounded-xl p-6 shadow-lg ${isArchived ? 'opacity-75 border-2 border-gray-300' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{event.name}</h3>
                        <p className="text-gray-600 mb-2">
                          {new Date(event.event_date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        {event.goal && (
                          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium mb-2">
                            Athletic Goal: {event.goal}
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          {timeText}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {isArchived && (
                          <div className="px-3 py-1 rounded-lg bg-gray-200 text-gray-600 text-xs font-semibold">
                            ARCHIVED
                          </div>
                        )}
                        {!isArchived && (
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            title="Edit event"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleArchiveEvent(event.id, isArchived)}
                          className={`p-2 rounded-lg transition-colors ${isArchived ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
                          title={isArchived ? 'Unarchive event' : 'Archive event'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isArchived ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            )}
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Permanently delete event"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Goal for this event */}
                    {eventGoal ? (
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">Your Training Goal</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditGoal(eventGoal)}
                              className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              title="Edit target workouts"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteGoal(eventGoal.id)}
                              className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              title="Delete training goal"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{eventGoal.workouts_completed}</p>
                            <p className="text-sm text-gray-600">Completed</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-600">{eventGoal.target_workouts}</p>
                            <p className="text-sm text-gray-600">Target</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-600">{eventGoal.hours_completed}h</p>
                            <p className="text-sm text-gray-600">Banked</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                              style={{width: `${Math.min(100, (eventGoal.workouts_completed / eventGoal.target_workouts) * 100)}%`}}
                            ></div>
                          </div>
                          <p className="text-center text-sm text-gray-600 mt-1">
                            {Math.round((eventGoal.workouts_completed / eventGoal.target_workouts) * 100)}% Complete
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-gray-200 pt-4">
                        <button
                          onClick={() => handleCreateGoalForEvent(event.id)}
                          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                        >
                          Create Training Goal
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      {(showCreateEvent || editingEvent) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 m-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Event Name</label>
                <input
                  type="text"
                  name="name"
                  value={eventForm.name}
                  onChange={handleEventFormChange}
                  placeholder="e.g., Marathon, Triathlon"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Event Date</label>
                <input
                  type="date"
                  name="eventDate"
                  value={eventForm.eventDate}
                  onChange={handleEventFormChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Athletic Goal (Optional)</label>
                <input
                  type="text"
                  name="goal"
                  value={eventForm.goal}
                  onChange={handleEventFormChange}
                  placeholder="e.g., Finish under 4 hours, PB in 200 free"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={resetForms}
                className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                disabled={!eventForm.name || !eventForm.eventDate || isSubmitting}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  !eventForm.name || !eventForm.eventDate || isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                }`}
              >
                {isSubmitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreateGoal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 m-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{editingGoal ? 'Edit Training Goal' : 'Create Training Goal'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Target Workouts</label>
                <input
                  type="number"
                  name="targetWorkouts"
                  value={goalForm.targetWorkouts || ''}
                  onChange={handleGoalFormChange}
                  min="1"
                  max="365"
                  placeholder={selectedEventForGoal && events.find(e => e.id === selectedEventForGoal) 
                    ? `Suggested: ${calculateTargetWorkouts(events.find(e => e.id === selectedEventForGoal)!.event_date)}` 
                    : '20'}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                {selectedEventForGoal && events.find(e => e.id === selectedEventForGoal) && (
                  <p className="text-sm text-gray-600 mt-1">
                    Based on your weekly frequency: {calculateTargetWorkouts(events.find(e => e.id === selectedEventForGoal)!.event_date)} workouts recommended
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={resetForms}
                className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}
                disabled={!goalForm.eventId || goalForm.targetWorkouts <= 0 || isSubmitting}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  !goalForm.eventId || goalForm.targetWorkouts <= 0 || isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
                }`}
              >
                {isSubmitting
                  ? (editingGoal ? 'Updating...' : 'Creating...')
                  : (editingGoal ? 'Update Goal' : 'Create Goal')}
              </button>
            </div>
          </div>
        </div>
      )}

      <FeedbackButton />
    </div>
  )
}
