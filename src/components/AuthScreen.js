import React, { useState } from 'react'
import { Activity } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

const AuthScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { signUp, signIn } = useAuth()

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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Activity style={{ width: '60px', height: '60px', color: 'white', margin: '0 auto 20px' }} />
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>💪 Athletic Tracker</h1>
          <p style={{ color: '#bfdbfe', fontSize: '16px' }}>30-second workout logging</p>
        </div>

        {/* Form */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          
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
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
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
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
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
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
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

          {/* Instructions */}
          <div style={{ marginTop: '20px', padding: '12px', background: '#f0f9ff', borderRadius: '8px' }}>
            <p style={{ fontSize: '14px', color: '#0369a1', margin: 0 }}>
              <strong>New user?</strong> Click "Create Account" first.<br/>
              <strong>Returning?</strong> Click "Sign In" instead.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AuthScreen
