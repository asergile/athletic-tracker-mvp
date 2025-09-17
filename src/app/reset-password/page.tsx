'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Activity, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Check if we have a valid password reset session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session && searchParams.get('type') === 'recovery') {
        setValidSession(true)
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }

    checkSession()
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Redirect to main app after 3 seconds
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    } catch (err) {
      setError('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px' 
      }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '40px', 
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <CheckCircle style={{ width: '60px', height: '60px', color: '#16a34a', margin: '0 auto 20px' }} />
          <h1 style={{ color: '#374151', fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>
            Password Updated!
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '20px' }}>
            Your password has been successfully updated. You'll be redirected to the app in a few seconds.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go to App
          </button>
        </div>
      </div>
    )
  }

  if (!validSession && error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px' 
      }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '40px', 
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <AlertCircle style={{ width: '60px', height: '60px', color: '#dc2626', margin: '0 auto 20px' }} />
          <h1 style={{ color: '#374151', fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>
            Link Expired
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '20px' }}>
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px' 
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Activity style={{ width: '60px', height: '60px', color: 'white', margin: '0 auto 20px' }} />
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
            💪 Athletic Tracker
          </h1>
          <p style={{ color: '#bfdbfe', fontSize: '16px' }}>Reset your password</p>
        </div>

        {/* Form */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '30px', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' 
        }}>
          <form onSubmit={handleResetPassword}>
            
            {/* New Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: '#374151', 
                fontWeight: '500', 
                marginBottom: '8px' 
              }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (6+ characters)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: '#374151', 
                fontWeight: '500', 
                marginBottom: '8px' 
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{ 
                background: '#fef2f2', 
                border: '1px solid #fca5a5', 
                color: '#dc2626', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px', 
                fontSize: '14px' 
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                color: 'white',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (loading || !password || !confirmPassword) ? 'not-allowed' : 'pointer',
                opacity: (loading || !password || !confirmPassword) ? 0.5 : 1
              }}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>

          </form>

          {/* Back to Login */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Back to Login
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function ResetPasswordLoading() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px' 
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        padding: '40px', 
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <Activity style={{ width: '60px', height: '60px', color: '#3b82f6', margin: '0 auto 20px' }} />
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading...</p>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
