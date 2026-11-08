'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

// Define the auth context interface
interface AuthContextType {
  user: User | null
  loading: boolean
  isHydrated: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>
  signInWithGoogle: () => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ data: any; error: any }>
  updatePassword: (newPassword: string) => Promise<{ data: any; error: any }>
}

// The cached user only speeds up the first render. sessionStorage can throw
// (blocked storage, some private modes), so every access is guarded.
const CACHE_KEY = 'auth-user'

const readCachedUser = (): User | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    try { sessionStorage.removeItem(CACHE_KEY) } catch { /* storage unavailable */ }
    return null
  }
}

const cacheUser = (user: User | null): void => {
  try {
    if (user) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(CACHE_KEY)
    }
  } catch { /* storage unavailable: the cache is only a speed-up */ }
}

// Create context with proper typing
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isHydrated, setIsHydrated] = useState<boolean>(false)

  useEffect(() => {
    // Mark as hydrated on client
    setIsHydrated(true)
    
    // Check for cached user first (only on client)
    const cachedUser = readCachedUser()
    if (cachedUser) {
      setUser(cachedUser)
      setLoading(false)
    }

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false)
        cacheUser(currentUser)
      })
      .catch((error) => {
        // Leave the state as it is rather than showing a signed-in user the sign-in
        // screen; LoadingScreen's slow-load notice offers a reload.
        console.error('Auth: getSession failed', error)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setLoading(false)
      cacheUser(currentUser)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Return to the site the user signed up on (production, test project or preview)
        emailRedirectTo: window.location.origin,
      },
    })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Without this, Supabase sends every Google login to the Site URL (production)
        redirectTo: window.location.origin,
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    // Clear cached auth data before signing out
    cacheUser(null)
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }

  const value: AuthContextType = {
    user,
    loading,
    isHydrated,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
