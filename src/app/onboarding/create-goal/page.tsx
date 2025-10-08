'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'
import { Calendar, Target, TrendingUp } from 'lucide-react'

export default function CreateFirstGoalPage(): React.ReactElement {
  const router = useRouter()
  const { user } = useAuth()

  // Form state
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [targetWorkouts, setTargetWorkouts] = useState<number | ''>('')
  const [suggestedWorkouts, setSuggestedWorkouts] = useState(0)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // User settings for calculation
  const [weeklyFrequency, setWeeklyFrequency] = useState(4)

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await dbHelpers.getUserSettings()
      if (data?.weekly_workout_frequency) {
        setWeeklyFrequency(data.weekly_workout_frequency)
      }
    }
    loadSettings()
  }, [])

  // Auto-calculate suggested workouts when date changes
  useEffect(() => {
    if (eventDate) {
      const today = new Date()
      const event = new Date(eventDate)
      const weeksRemaining = Math.max(0.1, (event.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const suggested = Math.ceil(weeksRemaining * weeklyFrequency)
      setSuggestedWorkouts(suggested)
      
      // Auto-fill target if not manually set
      if (!targetWorkouts) {
        setTargetWorkouts(suggested)
      }
    }
  }, [eventDate, weeklyFrequency, targetWorkouts])

  // Form validation
  const isValid = eventName.trim() !== '' && eventDate !== '' && targetWorkouts && targetWorkouts > 0

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid || !user) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Step 1: Create the event
      const eventResponse = await dbHelpers.createEvent({
        name: eventName,
        eventDate: eventDate,
        goal: goalDescription || undefined
      })

      if (eventResponse.error) {
        throw new Error(eventResponse.error.message)
      }

      const eventId = eventResponse.data?.id
      if (!eventId) {
        throw new Error('Event created but no ID returned')
      }

      // Step 2: Create the goal
      const goalResponse = await dbHelpers.createGoal(eventId, Number(targetWorkouts))

      if (goalResponse.error) {
        throw new Error(goalResponse.error.message)
      }

      // Step 3: Mark onboarding complete
      await dbHelpers.markOnboardingComplete()

      // Step 4: Show success screen (user clicks button to continue)
      setShowSuccess(true)

    } catch (err) {
      console.error('Error creating first goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to create goal. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Handle skip
  const handleSkip = async () => {
    setIsSubmitting(true)
    try {
      await dbHelpers.markOnboardingComplete()
      router.push('/')
    } catch (error) {
      console.error('Error skipping onboarding:', error)
      // Still redirect even if flag update fails
      router.push('/')
    }
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 p-6">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-4">Goal Created!</h1>
          <p className="text-xl text-white text-opacity-90 mb-8">
            You're all set! Now let's log your first workout and start banking hours toward your goal.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-5 px-8 rounded-xl bg-white text-green-900 font-bold text-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Log My First Workout 💪
          </button>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-green-500 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Create Your First Goal
          </h1>
          <p className="text-white text-opacity-90 text-lg">
            Set a target event and we'll help you stay on track
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-300 rounded-xl">
            <p className="text-white text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-5">
            <label className="flex items-center text-white font-semibold mb-3">
              <Calendar className="w-5 h-5 mr-2" />
              What event are you training for?
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Boston Marathon, Spring Triathlon"
              className="w-full p-4 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:outline-none text-lg"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Event Date */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-5">
            <label className="flex items-center text-white font-semibold mb-3">
              <Calendar className="w-5 h-5 mr-2" />
              When is your event?
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-4 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-green-400 focus:outline-none text-lg"
              disabled={isSubmitting}
            />
            {eventDate && (
              <p className="text-white text-opacity-80 text-sm mt-2">
                📅 {Math.ceil((new Date(eventDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))} days until your event
              </p>
            )}
          </div>

          {/* Goal Description (Optional) */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-5">
            <label className="flex items-center text-white font-semibold mb-3">
              <Target className="w-5 h-5 mr-2" />
              What's your athletic goal? (Optional)
            </label>
            <input
              type="text"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="e.g., Finish under 4 hours, PB in 200 free"
              className="w-full p-4 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:outline-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          {/* Target Workouts */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-5">
            <label className="flex items-center text-white font-semibold mb-3">
              <TrendingUp className="w-5 h-5 mr-2" />
              How many workouts until race day?
            </label>
            <input
              type="number"
              value={targetWorkouts}
              onChange={(e) => setTargetWorkouts(e.target.value ? parseInt(e.target.value) : '')}
              min="1"
              max="365"
              placeholder={suggestedWorkouts.toString()}
              className="w-full p-4 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:outline-none text-lg"
              disabled={isSubmitting}
            />
            {eventDate && suggestedWorkouts > 0 && (
              <div className="mt-3 p-3 bg-white bg-opacity-20 rounded-lg">
                <p className="text-white text-sm">
                  💡 <strong>We recommend {suggestedWorkouts} workouts</strong> based on your training schedule ({weeklyFrequency}x per week)
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full py-5 rounded-xl font-bold text-xl transition-all duration-200 ${
              !isValid || isSubmitting
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-white text-blue-900 hover:shadow-2xl hover:scale-105 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Your Goal...
              </span>
            ) : (
              '🎯 Create My Goal'
            )}
          </button>

          {/* Skip Option */}
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full py-4 text-white text-opacity-80 hover:text-opacity-100 font-medium transition-opacity"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  )
}
