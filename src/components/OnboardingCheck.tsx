'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'

/**
 * OnboardingCheck Component
 * 
 * Handles routing logic for the onboarding flow:
 * - Sends users with an incomplete profile to /complete-profile
 * - Prevents completed users from accessing /onboarding routes
 * - Runs once per auth session to avoid redirect loops
 */
export default function OnboardingCheck() {
  const { user, isHydrated, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      // Wait for auth to finish loading
      if (loading || !isHydrated) {
        return
      }

      // No user - nothing to check
      if (!user) {
        return
      }

      // Already checked this session
      if (checked) {
        return
      }

      // Pages that must stay reachable with an incomplete profile
      if (pathname === '/complete-profile' || pathname === '/reset-password') {
        return
      }

      // Everyone needs a display name, username and date of birth (dashboard '/' checks this itself)
      if (pathname !== '/') {
        const { data: profile } = await dbHelpers.getMyProfile()
        if (profile && !profile.is_complete) {
          router.push('/complete-profile')
          setChecked(true)
          return
        }
      }

      // Only check if user is trying to access onboarding routes
      const isOnboardingRoute = pathname.startsWith('/onboarding')
      if (!isOnboardingRoute) {
        setChecked(true)
        return
      }

      try {
        // User is on onboarding route - check if they should be
        const { data: settings, error } = await dbHelpers.getUserSettings()
        
        if (error) {
          console.error('Error fetching user settings:', error)
          setChecked(true)
          return
        }

        // Default to true if not set (safety fallback)
        const completed = settings?.onboarding_completed ?? true

        if (completed) {
          // Completed user shouldn't access onboarding - redirect
          console.log('Onboarding already completed, redirecting to dashboard')
          router.push('/')
        }

        setChecked(true)
      } catch (error) {
        console.error('Unexpected error checking onboarding:', error)
        setChecked(true)
      }
    }

    checkOnboarding()
  }, [user, isHydrated, loading, pathname, router, checked])

  // This component renders nothing - it only handles routing
  return null
}
