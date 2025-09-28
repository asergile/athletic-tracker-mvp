'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Activity, Target, Mic, FileText, Edit, ChevronLeft, Flag, User, Calendar, BarChart3, Plus, Route } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import AuthScreen from '@/components/AuthScreen'
import LoadingScreen from '@/components/LoadingScreen'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'
import FeedbackButton from '@/components/FeedbackButton'
import StandardNavigation from '@/components/StandardNavigation'

// TypeScript Interfaces
interface Workout {
  id: string;
  workout_type: string;
  duration: number;
  rating: number;
  date: string;
  distance?: number;
  distance_unit?: string;
  created_at: string;
  voice_transcription?: string;
  workout_analysis?: string;
}

interface RatingConfig {
  label: string;
  emoji: string;
  color: string;
}

interface WeeklyStats {
  count: number;
  totalTime: number;
  avgRating: number;
}

interface EditingWorkout {
  id: string;
  workout_type: string;
  duration: string | number; // Allow string for form inputs
  rating: number;
  date: string;
  distance?: number | string; // Allow string for form inputs
  distance_unit?: string;
  created_at: string;
  voice_transcription?: string;
  workout_analysis?: string;
  type: string;
  distanceUnit?: string;
}

// Shared utilities (copied from AthleticTracker)
const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}m`
}

const getWeekStart = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

const ratingLabels: Record<number, RatingConfig> = {
  1: { label: 'Struggled', emoji: '😤', color: 'from-red-500 to-red-600' },
  2: { label: 'Solid', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
  3: { label: 'Great', emoji: '🔥', color: 'from-green-500 to-emerald-600' }
}

export default function HistoryPage(): React.ReactElement {
  const { user, loading, isHydrated } = useAuth()
  const router = useRouter()
  
  // State
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [editingWorkout, setEditingWorkout] = useState<EditingWorkout | null>(null)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  
  // Load data
  useEffect(() => {
    if (user) {
      loadWorkouts()
    }
  }, [user])
  
  const loadWorkouts = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await dbHelpers.getUserWorkouts()
      if (response.data) {
        setWorkouts(response.data)
      }
    } catch (error) {
      console.error('Error loading workouts:', error)
      setError('Failed to load workouts')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Calculate weekly stats
  const weeklyStats = React.useMemo<WeeklyStats>(() => {
    const now = new Date()
    const weekStart = getWeekStart(now)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    const thisWeekWorkouts = workouts.filter((workout: Workout) => {
      const workoutDate = new Date(workout.date + 'T00:00:00')
      return workoutDate >= weekStart && workoutDate <= weekEnd
    })

    const totalTime = thisWeekWorkouts.reduce((sum: number, workout: Workout) => sum + workout.duration, 0)
    const avgRating = thisWeekWorkouts.length > 0 
      ? thisWeekWorkouts.reduce((sum: number, workout: Workout) => sum + workout.rating, 0) / thisWeekWorkouts.length 
      : 0

    return {
      count: thisWeekWorkouts.length,
      totalTime,
      avgRating
    }
  }, [workouts])
  
  // Voice analysis navigation
  const handleVoiceAnalysis = (workoutId: string): void => {
    router.push(`/voice-analysis/${workoutId}`)
  }

  // Edit workout functionality
  const handleEditWorkout = (workout: Workout): void => {
    setEditingWorkout({
      ...workout,
      type: workout.workout_type,
      distanceUnit: workout.distance_unit || 'miles'
    })
    setError('')
  }

  const handleUpdateWorkout = async (): Promise<void> => {
    if (!editingWorkout?.type || !editingWorkout?.duration || !editingWorkout?.rating) {
      setError('Please fill in all required fields')
      return
    }

    setIsUpdating(true)
    setError('')

    try {
      const updateData = {
        workout_type: editingWorkout.type,
        duration: parseInt(editingWorkout.duration.toString()),
        rating: editingWorkout.rating,
        date: editingWorkout.date,
        distance: editingWorkout.distance ? parseFloat(editingWorkout.distance.toString()) : undefined,
        distance_unit: editingWorkout.distance ? editingWorkout.distanceUnit : undefined
      }

      const response = await dbHelpers.updateWorkout(editingWorkout.id, updateData)
      
      if (response.error) {
        throw response.error
      }

      // Reload workouts to show updated data
      await loadWorkouts()
      setEditingWorkout(null)
    } catch (error) {
      console.error('Error updating workout:', error)
      setError('Failed to update workout. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = (): void => {
    setEditingWorkout(null)
    setError('')
  }

  if (loading || isLoading || !isHydrated) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with Standardized 5-Icon Navigation */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Workout History</h1>
            <p className="text-purple-200 text-sm sm:text-base">Track your progress</p>
          </div>
          <StandardNavigation currentPage="history" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center items-center text-center">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400 mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{formatTime(weeklyStats.totalTime)}</p>
            <p className="text-purple-200 text-xs sm:text-sm truncate">Total Time</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center items-center text-center">
            <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-green-400 mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{weeklyStats.count} workouts</p>
            <p className="text-purple-200 text-xs sm:text-sm truncate">This Week</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center items-center text-center">
            <Target className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-white">{weeklyStats.avgRating.toFixed(1)}</p>
            <p className="text-purple-200 text-xs sm:text-sm truncate">Avg Feel</p>
          </div>
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

      {/* Workout Content */}
      <div className="px-6 pb-8">
        {/* Add Workout Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/?showDatePicker=true')}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Add Workout</span>
          </button>
        </div>
        
        {/* Workout List */}
        <div className="space-y-4">
          {workouts.map((workout: Workout) => {
            const ratingConfig: RatingConfig = ratingLabels[workout.rating]
            
            const dateParts = workout.date.split('-')
            const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
            
            const today = new Date()
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            
            const isToday = date.toDateString() === today.toDateString()
            const isYesterday = date.toDateString() === yesterday.toDateString()
            
            let dateLabel
            if (isToday) {
              dateLabel = 'Today'
            } else if (isYesterday) {
              dateLabel = 'Yesterday'
            } else {
              const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' })
              const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              dateLabel = `${dayOfWeek}, ${monthDay}`
            }
            
            const hasVoiceData = workout.voice_transcription || workout.workout_analysis

            return (
              <div key={workout.id} className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 relative">
                {/* Action Buttons - Bigger and better positioned */}
                <div className="absolute top-4 right-4 flex space-x-3 z-10">
                  <button
                    onClick={() => handleVoiceAnalysis(workout.id)}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all relative"
                    title={hasVoiceData ? "View voice analysis" : "Add voice note"}
                  >
                    {hasVoiceData ? (
                      <FileText className="w-5 h-5 text-gray-600" />
                    ) : (
                      <>
                        <Mic className="w-5 h-5 text-gray-600" />
                        <Plus className="w-3 h-3 absolute -top-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleEditWorkout(workout)}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
                    title="Edit workout"
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Main Content */}
                <div className="pr-28">
                  {/* Workout type - prominent */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{workout.workout_type}</h3>
                  <p className="text-gray-500 text-sm font-medium mb-4">{dateLabel}</p>

                  {/* Stats in a row */}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <span className="text-lg font-bold text-gray-900">{formatTime(workout.duration)}</span>
                    </div>
                    {workout.distance && (
                      <div className="flex items-center space-x-2">
                        <Route className="w-5 h-5 text-gray-600" />
                        <span className="text-lg font-bold text-gray-900">{workout.distance}</span>
                        <span className="text-sm text-gray-600 font-medium">{workout.distance_unit}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating pill positioned below action buttons on the right */}
                <div className="absolute top-20 right-4">
                  <div className={`inline-flex items-center space-x-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r ${ratingConfig.color} text-white shadow-lg transform hover:scale-105 transition-transform`}>
                    <span className="text-xl">{ratingConfig.emoji}</span>
                    <span className="text-base font-bold">{ratingConfig.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {workouts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl sm:text-6xl mb-4">💪</div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Start Your Journey</h3>
            <p className="text-purple-200 text-sm sm:text-base px-4 mb-6">Log your first workout to see your progress here</p>
            <button
              onClick={() => router.push('/?showDatePicker=true')}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Log First Workout</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Edit Workout Modal */}
      {editingWorkout && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-3xl p-6 m-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Edit Workout</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700 p-2"
                disabled={isUpdating}
              >
                ×
              </button>
            </div>
            
            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-xl p-4 mb-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Workout Type */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Activity</label>
                <input
                  type="text"
                  value={editingWorkout.type}
                  onChange={(e) => setEditingWorkout(prev => prev ? ({ ...prev, type: e.target.value }) : null)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Running, Swimming"
                  disabled={isUpdating}
                />
              </div>
              
              {/* Duration */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={editingWorkout.duration}
                  onChange={(e) => setEditingWorkout(prev => prev ? ({ ...prev, duration: e.target.value }) : null)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="45"
                  min="1"
                  disabled={isUpdating}
                />
              </div>
              
              {/* Distance (Optional) */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Distance (optional)</label>
                <div className="flex space-x-3">
                  <input
                    type="number"
                    step="0.1"
                    value={editingWorkout.distance || ''}
                    onChange={(e) => setEditingWorkout(prev => prev ? ({ ...prev, distance: e.target.value }) : null)}
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="5.2"
                    disabled={isUpdating}
                  />
                  <select
                    value={editingWorkout.distanceUnit || 'miles'}
                    onChange={(e) => setEditingWorkout(prev => prev ? ({ ...prev, distanceUnit: e.target.value }) : null)}
                    className="w-28 p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                    disabled={isUpdating}
                  >
                    <option value="miles">miles</option>
                    <option value="kilometers">km</option>
                    <option value="meters">meters</option>
                    <option value="yards">yards</option>
                  </select>
                </div>
              </div>
              
              {/* Date */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={editingWorkout.date}
                  onChange={(e) => setEditingWorkout(prev => prev ? ({ ...prev, date: e.target.value }) : null)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  disabled={isUpdating}
                />
              </div>
              
              {/* Rating */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">How did it go?</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(ratingLabels).map(([rating, config]) => (
                    <button
                      key={rating}
                      onClick={() => setEditingWorkout(prev => prev ? ({ ...prev, rating: parseInt(rating) }) : null)}
                      disabled={isUpdating}
                      className={`p-4 rounded-xl transition-all duration-200 disabled:opacity-50 ${
                        editingWorkout.rating === parseInt(rating)
                          ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-2xl mb-1">{config.emoji}</div>
                      <div className="font-medium text-sm">{config.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                disabled={isUpdating}
                className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateWorkout}
                disabled={isUpdating || !editingWorkout.type || !editingWorkout.duration || !editingWorkout.rating}
                className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isUpdating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <FeedbackButton />
    </div>
  )
}
