import React, { useState, useEffect } from 'react'
import { dbHelpers } from '../lib/supabase.js'

export default function ProfileTest() {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const testResults = {}

    try {
      // Test 1: Get profile
      console.log('Testing getUserProfile...')
      const profileResult = await dbHelpers.getUserProfile()
      testResults.profile = profileResult
      console.log('Profile result:', profileResult)

      // Test 2: Get workouts with profile
      console.log('Testing getUserWorkoutsWithProfile...')
      const workoutsResult = await dbHelpers.getUserWorkoutsWithProfile(5)
      testResults.workoutsWithProfile = workoutsResult
      console.log('Workouts with profile:', workoutsResult)

      // Test 3: Update profile
      console.log('Testing updateUserProfile...')
      const updateResult = await dbHelpers.updateUserProfile({
        display_name: 'Test Update ' + Date.now()
      })
      testResults.profileUpdate = updateResult
      console.log('Profile update result:', updateResult)

      // Test 4: Try to update email (should fail or be ignored)
      console.log('Testing email update (should fail)...')
      const emailResult = await dbHelpers.updateUserProfile({
        display_name: 'Valid Name',
        email: 'should-not-work@example.com'
      })
      testResults.emailTest = emailResult
      console.log('Email update test:', emailResult)

    } catch (error) {
      console.error('Test error:', error)
      testResults.error = error.message
    }

    setResults(testResults)
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>Profile Functions Test</h2>
      
      <button 
        onClick={runTests} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: loading ? '#ccc' : '#007bff', 
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        {loading ? 'Running Tests...' : 'Run Profile Tests'}
      </button>

      {Object.keys(results).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Test Results:</h3>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Expected Results:</strong></p>
        <ul>
          <li>Profile should show your email and display name</li>
          <li>Workouts should include profiles data with email/display_name</li>
          <li>Profile update should work and change display_name</li>
          <li>Email update should be ignored (email should not change)</li>
        </ul>
        <p><em>Check browser console for detailed logs</em></p>
      </div>
    </div>
  )
}