import React, { useState } from 'react'
import { Activity, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

const AuthScreen = () => {
  const [authMode, setAuthMode] = useState('signin') // 'signin' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { signIn, signUp, signInWithGoogle } = useAuth()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
      }
      // Success will be handled by auth state change
    } catch (err) {
      setError('Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    if (!email || !password) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    try {
      let result
      if (authMode === 'signin') {
        result = await signIn(email, password)
      } else {
        result = await signUp(email, password)
      }

      if (result.error) {
        setError(result.error.message)
      } else if (authMode === 'signup' && result.data?.user && !result.data.session) {
        setMessage('Check your email for a verification link!')
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError(`Failed to ${authMode === 'signin' ? 'sign in' : 'sign up'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
    setError('')
    setMessage('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-full p-6 inline-block mb-6">
            <Activity className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">💪 Athletic Tracker</h1>
          <p className="text-blue-200">Log workouts in 30 seconds</p>
          <p className="text-blue-200">Track your progress instantly</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white border-2 border-gray-200 rounded-xl py-4 px-6 flex items-center justify-center space-x-3 hover:border-gray-300 hover:shadow-md transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <span className="text-gray-700 font-medium">
              {isLoading ? 'Connecting...' : 'Continue with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{authMode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                authMode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleAuthMode}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              disabled={isLoading}
            >
              {authMode === 'signin' 
                ? "Don't have an account? Create one" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>

          {/* Development Note */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-xs">
              <strong>Development Mode:</strong> Make sure to configure your Supabase credentials in .env.local
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthScreen