'use client'

import { useAuth } from '@/lib/AuthContext'
import AthleticTracker from '@/components/AthleticTracker'
import AuthScreen from '@/components/AuthScreen'
import LoadingScreen from '@/components/LoadingScreen'

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  return <AthleticTracker />
}
