'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { dbHelpers } from '../../../lib/security/enhanced-db-helpers'
import { getUserWorkouts, Workout } from '../../../lib/workouts'
import VoiceRecorder from '../../../components/VoiceRecorder'
import { Calendar, Clock, Route, Edit2, Plus, BarChart3, Flag, User, ChevronLeft, ChevronRight } from 'lucide-react'
import StandardNavigation from '../../../components/StandardNavigation'
import FeedbackButton from '@/components/FeedbackButton'



const ratingLabels = {
  1: { label: 'Struggled', emoji: '😤', color: 'from-red-500 to-red-600' },
  2: { label: 'Solid', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
  3: { label: 'Great', emoji: '🔥', color: 'from-green-500 to-emerald-600' }
}

const formatTime = (minutes: number) => {
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

// Format date string without timezone conversion
const formatDateString = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString()
}

// Calendar helper functions
const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  return new Date(year, month + 1, 0).getDate()
}

const getFirstDayOfMonth = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  return new Date(year, month, 1).getDay()
}

const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

export default function VoiceAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const workoutId = params.workoutId as string

  // State management
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [voiceWorkouts, setVoiceWorkouts] = useState<Workout[]>([])
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([])
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState<number>(-1)
  const [transcriptionResult, setTranscriptionResult] = useState<string>('')
  const [workoutAnalysis, setWorkoutAnalysis] = useState<any>(null)
  const [analysisSummary, setAnalysisSummary] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedTranscription, setEditedTranscription] = useState<string>('')
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false)
  const [editedAnalysis, setEditedAnalysis] = useState<string>('')
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  // Load workout data on mount
  useEffect(() => {
    if (user && workoutId) {
      loadWorkoutAndVoiceWorkouts()
    }
  }, [user, workoutId])

  const loadWorkoutAndVoiceWorkouts = async () => {
    if (!user || !workoutId) return

    try {
      // Get all user workouts
      const userWorkouts = await getUserWorkouts(user.id, 500)
      
      // Store all workouts for calendar
      setAllWorkouts(userWorkouts || [])
      
      // Filter to only workouts with voice data
      const workoutsWithVoice = userWorkouts?.filter(w => 
        w.voice_transcription || w.workout_analysis
      ) || []
      
      // Sort by date (newest first for navigation)
      workoutsWithVoice.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setVoiceWorkouts(workoutsWithVoice)
      
      // Find current workout and set index
      const foundWorkout = userWorkouts?.find(w => w.id === workoutId)
      if (foundWorkout) {
        setWorkout(foundWorkout)
        
        // Find index in voice workouts array
        const voiceIndex = workoutsWithVoice.findIndex(w => w.id === workoutId)
        setCurrentWorkoutIndex(voiceIndex)
        
        // Load existing voice data if available
        if (foundWorkout.voice_transcription) {
          setTranscriptionResult(foundWorkout.voice_transcription)
        }
        if (foundWorkout.workout_analysis) {
          setWorkoutAnalysis(foundWorkout.workout_analysis)
        }
      } else {
        setError('Workout not found')
      }
    } catch (err) {
      console.error('Error loading workout:', err)
      setError('Failed to load workout')
    }
  }

  // Navigation functions
  const goToPrevious = () => {
    if (currentWorkoutIndex < voiceWorkouts.length - 1) {
      const previousWorkout = voiceWorkouts[currentWorkoutIndex + 1]
      router.push(`/voice-analysis/${previousWorkout.id}`)
    }
  }

  const goToNext = () => {
    if (currentWorkoutIndex > 0) {
      const nextWorkout = voiceWorkouts[currentWorkoutIndex - 1]
      router.push(`/voice-analysis/${nextWorkout.id}`)
    }
  }

  // Check if navigation arrows should be shown
  const canGoToPrevious = currentWorkoutIndex < voiceWorkouts.length - 1
  const canGoToNext = currentWorkoutIndex > 0

  // Calendar functions
  const goToPreviousMonth = () => {
    const newMonth = new Date(calendarMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setCalendarMonth(newMonth)
  }

  const goToNextMonth = () => {
    const newMonth = new Date(calendarMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    // Don't go past current month
    const today = new Date()
    if (newMonth <= today) {
      setCalendarMonth(newMonth)
    }
  }

  const canGoToNextMonth = () => {
    const nextMonth = new Date(calendarMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const today = new Date()
    return nextMonth <= today
  }

  const handleDateClick = (date: Date) => {
    // Normalize to midnight to avoid timezone issues
    date.setHours(0, 0, 0, 0)
    // Format date in local timezone as YYYY-MM-DD to match database format
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    // Find ANY workout on this date (with or without voice data)
    const workoutsOnDate = allWorkouts.filter(w => w.date === dateStr)
    if (workoutsOnDate.length > 0) {
      router.push(`/voice-analysis/${workoutsOnDate[0].id}`)
      setShowCalendar(false)
    }
  }

  // Get dates with workouts or voice data
  const getDatesWithData = () => {
    const dates = new Set<string>()
    allWorkouts.forEach(w => {
      dates.add(w.date)
    })
    return dates
  }

  // Mobile swipe gesture support
  const [touchStartX, setTouchStartX] = useState<number>(0)
  const [touchEndX, setTouchEndX] = useState<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('textarea, input, [contenteditable="true"]')) {
      // Ignore touches inside editable fields so cursor placement / text
      // selection isn't misread as a swipe that navigates to another workout.
      setTouchStartX(0)
      setTouchEndX(0)
      return
    }
    setTouchStartX(e.targetTouches[0].clientX)
    setTouchEndX(e.targetTouches[0].clientX) // reset so a stationary tap can't inherit a stale touchEndX from a prior gesture
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return
    
    const distance = touchStartX - touchEndX
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && canGoToNext) {
      goToNext()
    }
    if (isRightSwipe && canGoToPrevious) {
      goToPrevious()
    }
  }

  // Voice upload handler
  const handleVoiceUpload = async (audioBlob: Blob) => {
    if (!workoutId || !user) {
      setError('No workout found for journal entry')
      return
    }

    setIsUploading(true)
    setError('')
    setTranscriptionResult('')

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      // Create form data
      const formData = new FormData()
      formData.append('audio', audioBlob, 'workout-journal-entry.webm')
      formData.append('workoutId', workoutId)

      // Upload and transcribe
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setTranscriptionResult(result.transcription)
      setWorkoutAnalysis(result.workoutAnalysis)
      setAnalysisSummary(result.analysisSummary)
      
      // Refresh workout to show updated transcription
      await loadWorkoutAndVoiceWorkouts()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Edit transcription handler
  const handleEditTranscription = () => {
    setEditedTranscription(transcriptionResult)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedTranscription('')
  }

  const handleSaveEdit = async () => {
    if (!workoutId || !user || !editedTranscription.trim()) {
      setError('Cannot save empty transcription')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      // Send edited transcription for re-analysis
      const response = await fetch('/api/reanalyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workoutId: workoutId,
          transcription: editedTranscription
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Re-analysis failed')
      }

      // Update state with new analysis
      setTranscriptionResult(editedTranscription)
      setWorkoutAnalysis(result.workoutAnalysis)
      setAnalysisSummary(result.analysisSummary)
      setIsEditing(false)
      setEditedTranscription('')
      
      // Refresh workout
      await loadWorkoutAndVoiceWorkouts()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-analysis failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Edit analysis handler
  const handleEditAnalysis = () => {
    if (workoutAnalysis?.markdownAnalysis) {
      setEditedAnalysis(workoutAnalysis.markdownAnalysis)
      setIsEditingAnalysis(true)
    }
  }

  const handleCancelAnalysisEdit = () => {
    setIsEditingAnalysis(false)
    setEditedAnalysis('')
  }

  const handleSaveAnalysisEdit = async () => {
    if (!workoutId || !user || !editedAnalysis.trim()) {
      setError('Cannot save empty analysis')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      // Send edited analysis for saving
      const response = await fetch('/api/update-analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workoutId: workoutId,
          analysis: editedAnalysis
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Analysis update failed')
      }

      // Update state with edited analysis
      const updatedAnalysis = {
        ...workoutAnalysis,
        markdownAnalysis: editedAnalysis
      }
      setWorkoutAnalysis(updatedAnalysis)
      setIsEditingAnalysis(false)
      setEditedAnalysis('')
      
      // Refresh workout
      await loadWorkoutAndVoiceWorkouts()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis update failed')
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-lg text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  if (!workout && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-lg text-white">Loading workout...</div>
      </div>
    )
  }

  const ratingConfig = workout ? ratingLabels[workout.rating] : null
  const datesWithData = getDatesWithData()
  
  // Calendar rendering
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth)
    const firstDayOfMonth = getFirstDayOfMonth(calendarMonth)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to midnight
    
    const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    const days = []
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 sm:h-10" />)
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
      date.setHours(0, 0, 0, 0) // Normalize to midnight
      // Format date in local timezone
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const dateDay = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${dateDay}`
      
      const hasData = datesWithData.has(dateStr)
      const hasVoiceData = voiceWorkouts.some(w => w.date === dateStr)
      const hasWorkoutOnly = hasData && !hasVoiceData
      const isToday = isSameDay(date, today)
      const isCurrentWorkout = workout && workout.date === dateStr
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          disabled={!hasData}
          className={`h-8 sm:h-10 flex items-center justify-center rounded-lg transition-all relative text-sm sm:text-base ${
            isToday ? 'bg-blue-500 text-white font-bold' : ''
          } ${
            isCurrentWorkout ? 'ring-2 ring-white ring-offset-2' : ''
          } ${
            hasVoiceData ? 'hover:bg-white hover:bg-opacity-20 cursor-pointer text-green-400 font-bold' : ''
          } ${
            hasWorkoutOnly ? 'hover:bg-white hover:bg-opacity-20 cursor-pointer text-white font-semibold' : ''
          } ${
            !hasData && !isToday ? 'text-gray-500 cursor-default' : ''
          }`}
        >
          {day}
        </button>
      )
    }
    
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-3 sm:p-4">
        {/* Month header with navigation and close button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h3 className="text-lg font-bold text-white">{monthName}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToNextMonth}
              disabled={!canGoToNextMonth()}
              className={`p-2 rounded-lg transition-all ${
                canGoToNextMonth() ? 'hover:bg-white hover:bg-opacity-10' : 'cursor-not-allowed opacity-50'
              }`}
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setShowCalendar(false)}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all ml-2"
              title="Close calendar"
            >
              <span className="text-white text-2xl leading-none">×</span>
            </button>
          </div>
        </div>
        
        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {dayNames.map(name => (
            <div key={name} className="text-center text-purple-200 text-xs sm:text-sm font-medium">
              {name}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 relative">
          {days}
        </div>
        
        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-white border-opacity-20 flex items-center justify-center space-x-3 text-[10px] sm:text-xs text-purple-200">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-400 rounded flex items-center justify-center text-[8px] font-bold text-gray-900">1</div>
            <span>Journal</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-white rounded flex items-center justify-center text-[8px] font-bold text-gray-900">1</div>
            <span>Workout</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded flex items-center justify-center text-[8px] font-bold text-white">1</div>
            <span>Today</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with Full Navigation */}
      <div className="px-6 pt-12 pb-8">
        {/* Top row - Title and StandardNavigation */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Performance Journal</h1>
            <p className="text-purple-200 text-sm sm:text-base">Detailed voice journal</p>
          </div>
          <StandardNavigation currentPage="" />
        </div>
        
        {/* Centered navigation: Back, Calendar, Forward */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {/* Previous button */}
          {canGoToPrevious ? (
            <button
              onClick={goToPrevious}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
              title="Previous voice analysis"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </button>
          ) : (
            <div className="w-12 h-12 sm:w-16 sm:h-16"></div>
          )}
          
          {/* Calendar button */}
          <button
          onClick={() => setShowCalendar(!showCalendar)}
          className={`bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 hover:bg-opacity-20 transition-all duration-200 touch-manipulation ${
          showCalendar ? 'ring-2 ring-white ring-opacity-60' : ''
          }`}
          title="Show calendar"
          >
          <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </button>
          
          {/* Next button */}
          {canGoToNext ? (
          <button
          onClick={goToNext}
          className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 sm:p-4 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
          title="Next voice analysis"
          >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </button>
          ) : (
          <div className="w-12 h-12 sm:w-16 sm:h-16"></div>
          )}
          </div>
          
          {/* Calendar Modal - Fixed overlay */}
          {showCalendar && (
          <>
          {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowCalendar(false)}
          />
          {/* Calendar */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4">
            {renderCalendar()}
          </div>
        </>
      )}

        {/* Workout Details Card */}
        {workout && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{workout.workout_type}</h2>
                <div className="flex items-center space-x-4 text-gray-600 mt-2">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateString(workout.date)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(workout.duration)}</span>
                  </div>
                  {workout.distance && (
                    <div className="flex items-center space-x-1">
                      <Route className="w-4 h-4" />
                      <span>{workout.distance} {workout.distance_unit}</span>
                    </div>
                  )}
                </div>
              </div>
              {ratingConfig && (
                <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${ratingConfig.color} text-white font-semibold flex items-center space-x-2`}>
                  <span>{ratingConfig.emoji}</span>
                  <span>{ratingConfig.label}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 pb-8">
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-xl p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Voice Recording Section - only show if no transcription exists */}
        {!transcriptionResult && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Journal Entry</h3>
            
            {isUploading && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                Uploading and transcribing audio...
              </div>
            )}

            <VoiceRecorder
              onRecordingComplete={handleVoiceUpload}
              disabled={isUploading}
            />
          </div>
        )}

        {/* Transcription Result */}
        {transcriptionResult && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Transcription Result</h3>
              {!isEditing && (
                <button
                  onClick={handleEditTranscription}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isUploading}
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit & Re-analyze</span>
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={editedTranscription}
                  onChange={(e) => setEditedTranscription(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Edit the transcription to fix any errors..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isUploading || !editedTranscription.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUploading ? 'Re-analyzing...' : 'Save & Re-analyze'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUploading}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">{transcriptionResult}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Workout Analysis */}
        {workoutAnalysis && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">AI Workout Analysis</h3>
              {!isEditingAnalysis && workoutAnalysis.markdownAnalysis && (
                <button
                  onClick={handleEditAnalysis}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isUploading}
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Analysis</span>
                </button>
              )}
            </div>
            
            {analysisSummary && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 font-medium">{analysisSummary}</p>
              </div>
            )}

            {isEditingAnalysis ? (
              <div className="space-y-4">
                <textarea
                  value={editedAnalysis}
                  onChange={(e) => setEditedAnalysis(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Edit the workout analysis markdown..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveAnalysisEdit}
                    disabled={isUploading || !editedAnalysis.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUploading ? 'Saving...' : 'Save Analysis'}
                  </button>
                  <button
                    onClick={handleCancelAnalysisEdit}
                    disabled={isUploading}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Display markdown analysis */}
                {workoutAnalysis.markdownAnalysis ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-gray-50 p-4 rounded border overflow-x-auto">
{workoutAnalysis.markdownAnalysis}
                    </pre>
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    No structured analysis available. Legacy format detected.
                  </div>
                )}
              </>
            )}

            {/* Error Display */}
            {workoutAnalysis.error && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800"><strong>Analysis Error:</strong> {workoutAnalysis.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Back to Dashboard Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      
      <FeedbackButton />
    </div>
  )
}
