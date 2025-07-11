import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

// Create Auth Context
const AuthContext = createContext({})

// Session timeout duration (48 hours in milliseconds)
const SESSION_TIMEOUT = 48 * 60 * 60 * 1000

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState(null)

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Check if session is expired (48 hours)
      if (session) {
        const sessionTime = new Date(session.created_at).getTime()
        const now = Date.now()
        
        if (now - sessionTime > SESSION_TIMEOUT) {
          // Session expired, sign out
          supabase.auth.signOut()
          setSession(null)
          setUser(null)
        } else {
          // Session valid, set last activity
          setLastActivity(now)
        }
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (session) {
          setLastActivity(Date.now())
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Activity tracker - reset session timeout on user interactions
  useEffect(() => {
    if (!session) return

    const handleActivity = () => {
      const now = Date.now()
      setLastActivity(now)
      
      // Check if we need to refresh the session
      const sessionTime = new Date(session.created_at).getTime()
      if (now - sessionTime > SESSION_TIMEOUT) {
        // Session expired, sign out
        supabase.auth.signOut()
      }
    }

    // Track user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [session])

  // Auto sign-out check
  useEffect(() => {
    if (!session || !lastActivity) return

    const checkTimeout = setInterval(() => {
      const now = Date.now()
      if (now - lastActivity > SESSION_TIMEOUT) {
        supabase.auth.signOut()
      }
    }, 60000) // Check every minute

    return () => clearInterval(checkTimeout)
  }, [session, lastActivity])

  // Auth methods
  const signIn = async (email, password) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    setLoading(false)
    return { data, error }
  }

  const signUp = async (email, password) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    setLoading(false)
    return { data, error }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    setLoading(false)
    return { data, error }
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setLoading(false)
    return { error }
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`
    })
    return { data, error }
  }

  // Context value
  const value = {
    user,
    session,
    loading,
    lastActivity,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth()
    
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      )
    }
    
    if (!user) {
      return null // Will be handled by App.js routing
    }
    
    return <Component {...props} />
  }
}