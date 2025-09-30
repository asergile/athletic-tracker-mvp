'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDebugInfo()
    }
  }, [user])

  const loadDebugInfo = async () => {
    try {
      // Get current user info
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      // Get workouts using dbHelpers
      const workoutsResponse = await dbHelpers.getUserWorkouts()
      
      // Get workouts directly from Supabase (bypass helpers)
      const { data: directWorkouts, error: directError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', authUser?.id || '')
        .order('date', { ascending: false })
      
      // Calculate weekly stats
      const now = new Date()
      const getWeekStart = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        return new Date(d.setDate(diff))
      }
      
      const weekStart = getWeekStart(now)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const thisWeekWorkouts = (workoutsResponse.data || []).filter((workout: any) => {
        const workoutDate = new Date(workout.date + 'T00:00:00')
        return workoutDate >= weekStart && workoutDate <= weekEnd
      })
      
      setDebugInfo({
        currentUser: {
          id: authUser?.id,
          email: authUser?.email
        },
        weekRange: {
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0],
          today: now.toISOString().split('T')[0]
        },
        dbHelpers: {
          success: !workoutsResponse.error,
          error: workoutsResponse.error?.message,
          count: workoutsResponse.data?.length || 0,
          workouts: workoutsResponse.data || []
        },
        directQuery: {
          success: !directError,
          error: directError?.message,
          count: directWorkouts?.length || 0,
          workouts: directWorkouts || []
        },
        thisWeek: {
          count: thisWeekWorkouts.length,
          workouts: thisWeekWorkouts,
          totalMinutes: thisWeekWorkouts.reduce((sum: number, w: any) => sum + w.duration, 0)
        }
      })
    } catch (err: any) {
      setDebugInfo({
        error: err.message,
        stack: err.stack
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Loading Debug Info...</h1>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Database Debug Information</h1>
      
      <div className="space-y-6">
        {/* Current User */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Current User</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo.currentUser, null, 2)}
          </pre>
        </div>

        {/* Week Range */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Week Range</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo.weekRange, null, 2)}
          </pre>
        </div>

        {/* DB Helpers Result */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">DB Helpers getUserWorkouts()</h2>
          <p className="mb-2">Success: {String(debugInfo.dbHelpers?.success)}</p>
          <p className="mb-2">Count: {debugInfo.dbHelpers?.count}</p>
          {debugInfo.dbHelpers?.error && (
            <p className="text-red-400 mb-2">Error: {debugInfo.dbHelpers.error}</p>
          )}
          <pre className="text-sm overflow-auto max-h-96">
            {JSON.stringify(debugInfo.dbHelpers?.workouts, null, 2)}
          </pre>
        </div>

        {/* Direct Query Result */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Direct Supabase Query</h2>
          <p className="mb-2">Success: {String(debugInfo.directQuery?.success)}</p>
          <p className="mb-2">Count: {debugInfo.directQuery?.count}</p>
          {debugInfo.directQuery?.error && (
            <p className="text-red-400 mb-2">Error: {debugInfo.directQuery.error}</p>
          )}
          <pre className="text-sm overflow-auto max-h-96">
            {JSON.stringify(debugInfo.directQuery?.workouts, null, 2)}
          </pre>
        </div>

        {/* This Week's Workouts */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">This Week's Workouts</h2>
          <p className="mb-2">Count: {debugInfo.thisWeek?.count}</p>
          <p className="mb-2">Total Minutes: {debugInfo.thisWeek?.totalMinutes}</p>
          <pre className="text-sm overflow-auto max-h-96">
            {JSON.stringify(debugInfo.thisWeek?.workouts, null, 2)}
          </pre>
        </div>
      </div>

      <button
        onClick={() => window.location.href = '/'}
        className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
      >
        Back to Dashboard
      </button>
    </div>
  )
}
