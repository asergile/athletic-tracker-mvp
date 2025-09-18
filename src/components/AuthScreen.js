import React, { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

const AuthScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const { signUp, signIn, signInWithGoogle, resetPassword } = useAuth()

  const handleCreateAccount = async () => {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await signUp(email, password)
      if (result.error) {
        setError(result.error.message)
      } else {
        // Success - user will be redirected automatically by AuthContext
      }
    } catch (err) {
      setError('Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError('Please enter your email address')
      return
    }

    setResetLoading(true)
    setError('')
    setResetSuccess('')

    try {
      const result = await resetPassword(resetEmail)
      if (result.error) {
        setError(result.error.message)
      } else {
        setResetSuccess('Password reset email sent! Check your inbox and spam folder.')
        setResetEmail('')
      }
    } catch (err) {
      setError('Failed to send reset email')
    } finally {
      setResetLoading(false)
    }
  }

  const openResetModal = () => {
    setShowResetModal(true)
    setResetEmail(email) // Pre-fill with current email if available
    setError('')
    setResetSuccess('')
  }

  const closeResetModal = () => {
    setShowResetModal(false)
    setResetEmail('')
    setError('')
    setResetSuccess('')
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await signIn(email, password)
      if (result.error) {
        setError(result.error.message)
      }
    } catch (err) {
      setError('Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signInWithGoogle()
      if (result.error) {
        setError(result.error.message)
      }
      // Success - OAuth redirect will happen automatically
    } catch (err) {
      setError('Failed to sign in with Google')
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a8a, #84cc16)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <img 
            src="/images/Logo PB white.png" 
            alt="Goal Buddy Logo" 
            style={{ width: '100px', height: '100px', margin: '0 auto 0px', display: 'block' }} 
          />
          <h1 style={{ color: 'white', fontSize: '26px', fontWeight: '700', marginBottom: '15px' }}>Goal Buddy</h1>
          <p style={{ color: '#f0f9ff', fontSize: '16px' }}>Track progress. Smash goals.</p>
        </div>

        {/* Form */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          
          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'white',
              color: '#374151',
              padding: '14px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? 'Signing In...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
            <span style={{ padding: '0 16px', color: '#6b7280', fontSize: '14px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#374151', fontWeight: '500', marginBottom: '8px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#84cc16'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#374151', fontWeight: '500', marginBottom: '8px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (6+ characters)"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#84cc16'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Create Account Button */}
          <button
            onClick={handleCreateAccount}
            disabled={isLoading || !email || !password}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #1e3a8a, #84cc16)',
              color: 'white',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: (isLoading || !email || !password) ? 0.5 : 1,
              marginBottom: '15px'
            }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={isLoading || !email || !password}
            style={{
              width: '100%',
              background: '#f3f4f6',
              color: '#374151',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: (isLoading || !email || !password) ? 0.5 : 1
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In (Existing User)'}
          </button>

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button
              onClick={openResetModal}
              disabled={isLoading}
              style={{
                background: 'none',
                border: 'none',
                color: '#1e3a8a',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* Instructions */}
          <div style={{ marginTop: '20px', padding: '12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #84cc16' }}>
            <p style={{ fontSize: '14px', color: '#166534', margin: 0 }}>
              <strong>Easiest:</strong> Use "Continue with Google" above.<br/>
              <strong>Or:</strong> Create account with email/password.
            </p>
          </div>

        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            width: '100%',
            maxWidth: '400px',
            position: 'relative'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#374151' }}>
              Reset Password
            </h2>
            
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {/* Reset Email Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#374151', fontWeight: '500', marginBottom: '8px' }}>Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#84cc16'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Success Message */}
            {resetSuccess && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                {resetSuccess}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={closeResetModal}
                disabled={resetLoading}
                style={{
                  flex: 1,
                  background: '#f3f4f6',
                  color: '#374151',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  opacity: resetLoading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetLoading || !resetEmail}
                style={{
                  flex: 1,
                  background: 'linear-gradient(to right, #1e3a8a, #84cc16)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (resetLoading || !resetEmail) ? 'not-allowed' : 'pointer',
                  opacity: (resetLoading || !resetEmail) ? 0.5 : 1
                }}
              >
                {resetLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthScreen
