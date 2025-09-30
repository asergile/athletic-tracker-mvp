'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'
import { Clock, Target, TrendingUp } from 'lucide-react'

interface Workout {
  id: string
  workout_type: string
  duration: number
  rating: number
  date: string
  distance?: number
  distance_unit?: string
  created_at: string
}

export default function MetricsTestPage() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    if (user) {
      loadAndCalculate()
    }
  }, [user])

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}m`
  }

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)  // Normalize to midnight
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d
  }

  const loadAndCalculate = async () => {
    console.log('=== METRICS TEST PAGE ===')
    console.log('1. Loading workouts...')
    
    try {
      // Load workouts
      const workoutsResponse = await dbHelpers.getUserWorkouts()
      console.log('2. Workouts response:', {
        hasData: !!workoutsResponse.data,
        count: workoutsResponse.data?.length,
        error: workoutsResponse.error?.message
      })

      if (!workoutsResponse.data) {
        console.log('3. No workout data returned')
        setLoading(false)
        return
      }

      const loadedWorkouts = workoutsResponse.data
      setWorkouts(loadedWorkouts)
      console.log('3. Set workouts state with', loadedWorkouts.length, 'workouts')

      // Calculate week range
      const now = new Date()
      console.log('4. Current date:', now.toISOString())
      
      const weekStart = getWeekStart(now)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      console.log('5. Week range:', {
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0]
      })

      // Filter workouts for this week
      console.log('6. Filtering workouts...')
      const thisWeekWorkouts = loadedWorkouts.filter((workout, index) => {
        const workoutDate = new Date(workout.date + 'T00:00:00')
        const isInRange = workoutDate >= weekStart && workoutDate <= weekEnd
        
        if (index < 5) { // Log first 5 workouts
          console.log(`   Workout ${index + 1}:`, {
            date: workout.date,
            workoutDateTime: workoutDate.toISOString(),
            weekStartTime: weekStart.toISOString(),
            weekEndTime: weekEnd.toISOString(),
            comparison: {
              'workout >= weekStart': workoutDate >= weekStart,
              'workout <= weekEnd': workoutDate <= weekEnd,
              'IN RANGE': isInRange
            }
          })
        }
        
        return isInRange
      })

      console.log('7. Filtered results:', {
        totalWorkouts: loadedWorkouts.length,
        thisWeekCount: thisWeekWorkouts.length,
        thisWeekDates: thisWeekWorkouts.map(w => w.date)
      })

      // Calculate metrics
      const totalTime = thisWeekWorkouts.reduce((sum, workout) => sum + workout.duration, 0)
      const avgRating = thisWeekWorkouts.length > 0 
        ? thisWeekWorkouts.reduce((sum, workout) => sum + workout.rating, 0) / thisWeekWorkouts.length 
        : 0

      console.log('8. Calculated metrics:', {
        count: thisWeekWorkouts.length,
        totalTime,
        totalTimeFormatted: formatTime(totalTime),
        avgRating: avgRating.toFixed(1)
      })

      // Calculate weekly streak
      let streak = 0
      for (let i = 0; i < 52; i++) {
        const ws = new Date(now)
        ws.setHours(0, 0, 0, 0)  // Normalize to midnight
        ws.setDate(ws.getDate() - (i * 7) - (now.getDay() === 0 ? 6 : now.getDay() - 1))
        const we = new Date(ws)
        we.setDate(we.getDate() + 6)
        
        const weekWorkouts = loadedWorkouts.filter(workout => {
          const workoutDate = new Date(workout.date + 'T00:00:00')
          return workoutDate >= ws && workoutDate <= we
        })
        
        if (weekWorkouts.length > 0) {
          streak++
        } else {
          break
        }
      }

      console.log('9. Weekly streak:', streak)

      setDebugInfo({
        weekRange: {
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0],
          today: now.toISOString().split('T')[0]
        },
        workoutsLoaded: loadedWorkouts.length,
        thisWeekWorkouts: {
          count: thisWeekWorkouts.length,
          totalTime,
          avgRating,
          workouts: thisWeekWorkouts
        },
        weeklyStreak: streak,
        allWorkoutDates: loadedWorkouts.map(w => w.date).slice(0, 10)
      })

    } catch (error) {
      console.error('ERROR:', error)
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Loading Metrics Test...</h1>
      </div>
    )
  }

  const weeklyStats = debugInfo.thisWeekWorkouts || { count: 0, totalTime: 0, avgRating: 0 }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Metrics Calculation Test</h1>

      {/* Replicate the actual metrics cards */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Actual Metrics Cards (Like in App)</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 min-h-[120px] flex flex-col justify-center items-center text-center">
            <Clock className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-white">{formatTime(weeklyStats.totalTime)}</p>
            <p className="text-purple-200 text-sm">Total Time</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 min-h-[120px] flex flex-col justify-center items-center text-center">
            <Target className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-2xl font-bold text-white">{weeklyStats.count} workouts</p>
            <p className="text-purple-200 text-sm">This Week</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 min-h-[120px] flex flex-col justify-center items-center text-center">
            <TrendingUp className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-2xl font-bold text-white">{debugInfo.weeklyStreak || 0} weeks</p>
            <p className="text-purple-200 text-sm">Weekly Streak</p>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="space-y-6">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold text-white mb-2">Week Range</h2>
          <pre className="text-sm text-gray-300 overflow-auto">
            {JSON.stringify(debugInfo.weekRange, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold text-white mb-2">Summary</h2>
          <div className="text-gray-300 space-y-1">
            <p>Total workouts loaded: {debugInfo.workoutsLoaded}</p>
            <p>This week count: {weeklyStats.count}</p>
            <p>This week total time: {formatTime(weeklyStats.totalTime)}</p>
            <p>This week avg rating: {weeklyStats.avgRating?.toFixed(1)}</p>
            <p>Weekly streak: {debugInfo.weeklyStreak}</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold text-white mb-2">First 10 Workout Dates in Database</h2>
          <pre className="text-sm text-gray-300 overflow-auto">
            {JSON.stringify(debugInfo.allWorkoutDates, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold text-white mb-2">This Week's Workouts</h2>
          <pre className="text-sm text-gray-300 overflow-auto max-h-96">
            {JSON.stringify(debugInfo.thisWeekWorkouts?.workouts, null, 2)}
          </pre>
        </div>
      </div>

      <button
        onClick={() => window.location.href = '/'}
        className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white"
      >
        Back to Dashboard
      </button>
    </div>
  )
}
