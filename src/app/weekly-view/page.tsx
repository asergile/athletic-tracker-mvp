'use client'

import { AuthProvider, useAuth } from '@/lib/AuthContext'
import WeeklyWorkoutView from '@/components/WeeklyWorkoutView'
import AuthScreen from '@/components/AuthScreen'
import LoadingScreen from '@/components/LoadingScreen'

function WeeklyViewContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  return <WeeklyWorkoutView />
}

export default function WeeklyViewPage() {
  return (
    <AuthProvider>
      <WeeklyViewContent />
    </AuthProvider>
  )
}