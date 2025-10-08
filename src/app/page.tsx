'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AuthScreen from '@/components/AuthScreen'
import LoadingScreen from '@/components/LoadingScreen'
import AthleticTracker from '@/components/AthleticTracker'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'

export default function DashboardPage() {
  const { user, loading, isHydrated } = useAuth()
  const router = useRouter()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [shouldRender, setShouldRender] = useState(false)

  // Check onboarding status for authenticated users
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || !isHydrated) {
        setCheckingOnboarding(false)
        return
      }

      try {
        const { data: settings } = await dbHelpers.getUserSettings()
        const completed = settings?.onboarding_completed ?? true

        if (!completed) {
          // User needs onboarding - redirect
          console.log('Dashboard: redirecting to onboarding')
          router.push('/onboarding')
        } else {
          // User has completed onboarding - allow render
          setShouldRender(true)
          setCheckingOnboarding(false)
        }
      } catch (error) {
        console.error('Error checking onboarding in dashboard:', error)
        // On error, allow render
        setShouldRender(true)
        setCheckingOnboarding(false)
      }
    }

    checkOnboarding()
  }, [user, isHydrated, router])

  if (loading || !isHydrated) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  if (checkingOnboarding || !shouldRender) {
    return <LoadingScreen />
  }

  return (
    <AthleticTracker />
  )
}
