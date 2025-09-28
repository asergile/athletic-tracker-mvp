'use client'

import { useAuth } from '@/lib/AuthContext'
import AuthScreen from '@/components/AuthScreen'
import LoadingScreen from '@/components/LoadingScreen'
import AthleticTracker from '@/components/AthleticTracker'

export default function DashboardPage() {
  const { user, loading, isHydrated } = useAuth()

  if (loading || !isHydrated) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <AthleticTracker />
  )
}
