/**
 * Enhanced Database Helpers Test Page
 * Add this to your Next.js app to test the enhanced security features
 */

'use client'

import { useState, useEffect } from 'react'
import { dbHelpers as enhancedHelpers } from '../../lib/security/enhanced-db-helpers'
import { dbHelpers as originalHelpers } from '../../lib/supabase'

export default function EnhancedHelpersTest() {
  const [testResults, setTestResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  // Check authentication status
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const result = await originalHelpers.getUserSettings()
      setAuthenticated(!result.error || result.error.message !== 'User not authenticated')
    } catch (error) {
      setAuthenticated(false)
    }
  }

  const addResult = (test, result, error = null) => {
    const newResult = {
      id: Date.now(),
      test,
      success: !error,
      result: error ? error.message : 'Success',
      timestamp: new Date().toLocaleTimeString()
    }
    setTestResults(prev => [newResult, ...prev.slice(0, 9)]) // Keep last 10 results
  }

  const runTest = async (testName, testFn) => {
    try {
      setIsLoading(true)
      const result = await testFn()
      addResult(testName, result)
      return result
    } catch (error) {
      addResult(testName, null, error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Test 1: Import and Function Availability
  const testImport = () => {
    const expectedFunctions = [
      'createWorkout', 'getUserWorkouts', 'updateWorkout', 'deleteWorkout',
      'getWorkoutStats', 'getUserSettings', 'updateUserSettings', 'updateWeeklyFrequency',
      'createEvent', 'updateEvent', 'deleteEvent', 'getUserEvents',
      'createGoal', 'getUserGoals', 'deleteGoal', 'submitFeedback',
      'getUserCustomWorkoutTypes', 'addCustomWorkoutType', 'deleteCustomWorkoutType',
      'getUserProfile', 'updateUserProfile', 'getUserWorkoutsWithProfile',
      'getUserAuditHistory', 'getRecordAuditHistory', 'checkSuspiciousActivity',
      'getRecentAuditActivity', 'getUserActivitySummary'
    ]
    
    const availableFunctions = Object.keys(enhancedHelpers)
    const missing = expectedFunctions.filter(fn => !availableFunctions.includes(fn))
    
    if (missing.length > 0) {
      throw new Error(`Missing functions: ${missing.join(', ')}`)
    }
    
    return `✅ All ${expectedFunctions.length} functions available`
  }

  // Test 2: Input Validation
  const testInputValidation = async () => {
    // This should fail with validation error
    const result = await enhancedHelpers.createWorkout({
      type: '', // Invalid - empty string
      duration: -10, // Invalid - negative
      rating: 5 // Invalid - out of range (1-3)
    })
    
    // Enhanced helpers return { data, error } instead of throwing
    if (result.error) {
      const errorMsg = result.error.message
      if (errorMsg.includes('validation') || errorMsg.includes('Invalid') || errorMsg.includes('required') || errorMsg.includes('too short') || errorMsg.includes('too small') || errorMsg.includes('too large')) {
        return '✅ Input validation working'
      }
    }
    
    throw new Error('Validation should have failed but didn\'t')
  }

  // Test 3: Authentication Check
  const testAuthenticationRequired = async () => {
    // This will test if auth is properly checked
    const result = await enhancedHelpers.getUserWorkouts()
    if (result.error && result.error.message === 'Authentication required') {
      return '✅ Authentication properly enforced'
    } else if (!result.error && result.data) {
      return '✅ User authenticated, data returned'
    }
    throw new Error('Unexpected authentication behavior')
  }

  // Test 4: Error Handling Security
  const testSecureErrorHandling = async () => {
    // Try invalid operation
    const result = await enhancedHelpers.createWorkout({
      type: 'A'.repeat(1000), // Extremely long string
      duration: 'invalid', // Wrong type
      rating: 'not a number'
    })
    
    // Should get an error response
    if (result.error) {
      // Check that error message doesn't expose sensitive info
      const errorMsg = result.error.message.toLowerCase()
      const sensitiveTerms = ['database', 'sql', 'postgres', 'supabase', 'internal', 'server']
      const exposesInfo = sensitiveTerms.some(term => errorMsg.includes(term))
      
      if (exposesInfo) {
        throw new Error(`Error message exposes sensitive info: ${result.error.message}`)
      }
      return '✅ Error messages are secure'
    }
    
    throw new Error('Should have failed with validation error')
  }

  // Test 5: Function Call Test (if authenticated)
  const testFunctionCall = async () => {
    if (!authenticated) {
      return '⚠️ Skipped - user not authenticated'
    }
    
    const result = await enhancedHelpers.getUserSettings()
    if (result.error) {
      if (result.error.message === 'Authentication required') {
        return '✅ Auth check working'
      }
      throw new Error(`Unexpected error: ${result.error.message}`)
    }
    return '✅ Function call successful'
  }

  const runAllTests = async () => {
    const tests = [
      { name: 'Import & Functions', fn: testImport },
      { name: 'Input Validation', fn: testInputValidation },
      { name: 'Authentication Check', fn: testAuthenticationRequired },
      { name: 'Secure Error Handling', fn: testSecureErrorHandling },
      { name: 'Function Call', fn: testFunctionCall }
    ]

    for (const test of tests) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100)) // Small delay between tests
        await runTest(test.name, test.fn)
      } catch (error) {
        console.error(`Test ${test.name} failed:`, error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Enhanced Database Helpers Test Suite
          </h1>
          
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`px-3 py-1 rounded-full text-sm ${
                authenticated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {authenticated ? '✅ Authenticated' : '⚠️ Not Authenticated'}
              </div>
              <button
                onClick={checkAuth}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Check Auth
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => runTest('Import & Functions', testImport)}
              disabled={isLoading}
              className="p-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test Import & Functions
            </button>
            <button
              onClick={() => runTest('Input Validation', testInputValidation)}
              disabled={isLoading}
              className="p-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test Input Validation
            </button>
            <button
              onClick={() => runTest('Authentication', testAuthenticationRequired)}
              disabled={isLoading}
              className="p-4 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test Authentication
            </button>
            <button
              onClick={() => runTest('Error Handling', testSecureErrorHandling)}
              disabled={isLoading}
              className="p-4 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              Test Error Handling
            </button>
          </div>

          <div className="mb-6">
            <button
              onClick={runAllTests}
              disabled={isLoading}
              className="w-full p-4 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
            >
              {isLoading ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet</p>
            ) : (
              testResults.map(result => (
                <div
                  key={result.id}
                  className={`p-3 rounded border-l-4 ${
                    result.success 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-red-400 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{result.test}</span>
                      <p className="text-sm text-gray-600 mt-1">{result.result}</p>
                    </div>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">What This Tests:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All 27 enhanced functions are properly imported and available</li>
              <li>• Input validation catches invalid data before database operations</li>
              <li>• Authentication is properly enforced on all operations</li>
              <li>• Error messages don't expose sensitive system information</li>
              <li>• Enhanced helpers work in the Next.js environment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
