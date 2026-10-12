'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { dbHelpers, USERNAME_PATTERN } from '@/lib/security/enhanced-db-helpers'
import { ageFromDateOfBirth, parseDateParts, setAgeBlock } from '@/lib/age-gate'
import AuthScreen from '@/components/AuthScreen'
import LoadingScreen from '@/components/LoadingScreen'
import AgeBlockedScreen from '@/components/AgeBlockedScreen'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

/**
 * One-time "Complete your profile" screen.
 * Shown to anyone missing a display name, username or date of birth:
 * new users right after sign-up, existing users on their next visit.
 */
export default function CompleteProfilePage(): React.ReactElement {
  const { user, loading, isHydrated, signOut } = useAuth()
  const router = useRouter()

  const [ready, setReady] = useState(false)
  const [needsUsername, setNeedsUsername] = useState(false)
  const [needsDob, setNeedsDob] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobDay, setDobDay] = useState('')
  const [dobYear, setDobYear] = useState('')

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [blocked, setBlocked] = useState(false)

  // Load what's already on file
  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data, error: loadError } = await dbHelpers.getMyProfile()
      if (loadError || !data) {
        setError('Could not load your profile. Please refresh.')
        setReady(true)
        return
      }
      if (data.is_complete) {
        router.replace('/')
        return
      }
      // Old accounts got the email prefix as a default display name; don't reuse it.
      const emailPrefix = (user.email || '').split('@')[0]
      const existingName = data.display_name && data.display_name !== emailPrefix ? data.display_name : ''
      setDisplayName(existingName)
      setUsername(data.username || '')
      setNeedsUsername(!data.username)
      setNeedsDob(!data.has_date_of_birth)
      setReady(true)
    }
    load()
  }, [user, router])

  // Debounced username availability check
  useEffect(() => {
    if (!needsUsername) return
    const candidate = username.trim()
    if (!candidate) {
      setUsernameStatus('idle')
      return
    }
    if (!USERNAME_PATTERN.test(candidate)) {
      setUsernameStatus('invalid')
      return
    }
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const { data } = await dbHelpers.isUsernameAvailable(candidate)
      setUsernameStatus(data ? 'available' : 'taken')
    }, 400)
    return () => clearTimeout(timer)
  }, [username, needsUsername])

  const handleUnder13 = async (dateOfBirth: string): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await fetch('/api/account/underage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ date_of_birth: dateOfBirth })
        })
      }
    } catch (err) {
      console.error('Under-13 deletion request failed:', err)
    }
    setAgeBlock()
    await signOut()
    setBlocked(true)
  }

  const handleSubmit = async (): Promise<void> => {
    setError('')
    const name = displayName.trim()
    if (!name) {
      setError('Enter a display name.')
      return
    }
    if (needsUsername && usernameStatus !== 'available') {
      setError(usernameStatus === 'taken' ? 'That username is taken.' : 'Choose an available username.')
      return
    }
    let dateOfBirth = ''
    if (needsDob) {
      const parsed = parseDateParts(dobMonth, dobDay, dobYear)
      if ('error' in parsed) {
        setError(parsed.error)
        return
      }
      dateOfBirth = parsed.date
      const age = ageFromDateOfBirth(dateOfBirth)
      if (age !== null && age < 13) {
        setSaving(true)
        await handleUnder13(dateOfBirth)
        return
      }
    }

    setSaving(true)
    try {
      if (needsDob) {
        const { error: dobError } = await dbHelpers.saveDateOfBirth(dateOfBirth)
        if (dobError?.message === 'under_13') {
          await handleUnder13(dateOfBirth)
          return
        }
        if (dobError) {
          setError(dobError.message)
          return
        }
      }

      const updates: { display_name: string; username?: string } = { display_name: name }
      if (needsUsername) updates.username = username.trim()
      const { error: updateError } = await dbHelpers.updateMyProfile(updates)
      if (updateError) {
        setError(updateError.message)
        return
      }
      router.replace('/')
    } finally {
      setSaving(false)
    }
  }

  if (blocked) return <AgeBlockedScreen />
  if (loading || !isHydrated) return <LoadingScreen />
  if (!user) return <AuthScreen />
  if (!ready) return <LoadingScreen />

  const usernameHint: Record<UsernameStatus, { text: string; className: string }> = {
    idle: { text: '3–20 letters, numbers or underscores.', className: 'text-gray-500' },
    checking: { text: 'Checking…', className: 'text-gray-500' },
    available: { text: 'Available', className: 'text-green-600' },
    taken: { text: 'Already taken', className: 'text-red-600' },
    invalid: { text: '3–20 letters, numbers or underscores.', className: 'text-red-600' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Complete your profile</h1>
        <p className="text-gray-600 mb-6">This takes about 20 seconds.</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-5">
          <div>
            <label htmlFor="displayName" className="block text-gray-700 font-medium mb-1">Display name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="e.g., Alex Rivera"
              autoComplete="name"
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
            <p className="mt-1 text-sm text-gray-500">How coaches and teammates you invite will see you.</p>
          </div>

          {needsUsername && (
            <div>
              <label htmlFor="username" className="block text-gray-700 font-medium mb-1">Username</label>
              <div className="flex items-center border border-gray-200 rounded-lg focus-within:border-purple-500">
                <span className="pl-3 text-gray-400">@</span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full p-3 rounded-lg focus:outline-none"
                />
              </div>
              <p className={`mt-1 text-sm ${usernameHint[usernameStatus].className}`}>
                {usernameHint[usernameStatus].text}
              </p>
            </div>
          )}

          {needsDob && (
            <fieldset>
              <legend className="block text-gray-700 font-medium mb-1">Date of birth</legend>
              <p className="mb-2 text-sm text-gray-500">For example, 3 27 2010</p>
              <div className="flex gap-3">
                <div className="w-16">
                  <label htmlFor="dobMonth" className="block text-sm text-gray-600 mb-1">Month</label>
                  <input
                    id="dobMonth"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="bday-month"
                    maxLength={2}
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-3 border border-gray-200 rounded-lg text-center focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="w-16">
                  <label htmlFor="dobDay" className="block text-sm text-gray-600 mb-1">Day</label>
                  <input
                    id="dobDay"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="bday-day"
                    maxLength={2}
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-3 border border-gray-200 rounded-lg text-center focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="w-24">
                  <label htmlFor="dobYear" className="block text-sm text-gray-600 mb-1">Year</label>
                  <input
                    id="dobYear"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="bday-year"
                    maxLength={4}
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-3 border border-gray-200 rounded-lg text-center focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">Private. Used only for age checks and never shown to anyone.</p>
            </fieldset>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className={`mt-6 w-full py-3 px-4 rounded-lg font-medium transition-all ${
            saving
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-lg'
          }`}
        >
          {saving ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
