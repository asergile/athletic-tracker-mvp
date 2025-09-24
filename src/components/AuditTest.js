import React, { useState } from 'react'
import { dbHelpers } from '../lib/supabase.js'

export default function AuditTest() {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)

  const testAuditSystem = async () => {
    setLoading(true)
    const testResults = {}

    try {
      console.log('Testing audit system...')

      // Test 1: Make a profile update to generate audit log
      console.log('1. Creating audit trail by updating profile...')
      const profileUpdate = await dbHelpers.updateUserProfile({
        display_name: 'Audit Test ' + Date.now()
      })
      testResults.profileUpdate = profileUpdate
      console.log('Profile updated:', profileUpdate)

      // Wait a moment for audit log to be created
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Test 2: Get user's audit history
      console.log('2. Getting audit history...')
      const auditHistory = await dbHelpers.getUserAuditHistory(10)
      testResults.auditHistory = auditHistory
      console.log('Audit history:', auditHistory)

      // Test 3: Get user activity summary
      console.log('3. Getting activity summary...')
      const activitySummary = await dbHelpers.getUserActivitySummary()
      testResults.activitySummary = activitySummary
      console.log('Activity summary:', activitySummary)

      // Test 4: Check for suspicious activity
      console.log('4. Checking for suspicious activity...')
      const suspiciousActivity = await dbHelpers.checkSuspiciousActivity()
      testResults.suspiciousActivity = suspiciousActivity
      console.log('Suspicious activity:', suspiciousActivity)

      // Test 5: Create a workout to test audit on workouts table
      console.log('5. Creating workout to test audit...')
      const workoutCreate = await dbHelpers.createWorkout({
        type: 'Audit Test',
        duration: 5,
        rating: 2,
        distance: 0,
        distance_unit: 'miles'
      })
      testResults.workoutCreate = workoutCreate
      console.log('Workout created:', workoutCreate)

    } catch (error) {
      console.error('Test error:', error)
      testResults.error = error.message
    }

    setResults(testResults)
    setLoading(false)
  }

  const formatAuditEntry = (entry) => {
    return {
      operation: entry.operation,
      table: entry.table_name,
      when: new Date(entry.created_at).toLocaleString(),
      changes: entry.operation === 'UPDATE' ? {
        old: entry.old_values,
        new: entry.new_values
      } : entry.new_values || entry.old_values
    }
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>🔍 Audit System Test</h2>
      
      <button 
        onClick={testAuditSystem} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: loading ? '#ccc' : '#28a745', 
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        {loading ? 'Testing Audit System...' : 'Test Audit & Monitoring'}
      </button>

      {Object.keys(results).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Audit Test Results:</h3>
          
          {results.auditHistory?.data?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4>📋 Your Recent Activity:</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
                {results.auditHistory.data.slice(0, 5).map((entry, i) => {
                  const formatted = formatAuditEntry(entry)
                  return (
                    <div key={i} style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      <strong>{formatted.operation}</strong> on {formatted.table} at {formatted.when}
                      {formatted.operation === 'UPDATE' && formatted.changes.old && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Changed: {JSON.stringify(formatted.changes.old.display_name)} → {JSON.stringify(formatted.changes.new.display_name)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {results.activitySummary?.data?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4>📊 Activity Summary:</h4>
              <div style={{ fontSize: '14px' }}>
                {results.activitySummary.data.map((summary, i) => (
                  <div key={i}>
                    {summary.operation_count} {summary.operation} operations on {summary.table_name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <details style={{ marginTop: '20px' }}>
            <summary>🔍 Full Test Results (Click to expand)</summary>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              marginTop: '10px'
            }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>What This Tests:</strong></p>
        <ul>
          <li>✅ Audit logging when profile is updated</li>
          <li>✅ Audit logging when workouts are created</li>
          <li>✅ Audit history retrieval</li>
          <li>✅ Activity summary generation</li>
          <li>✅ Suspicious activity detection</li>
        </ul>
        <p><em>Check browser console for detailed logs</em></p>
      </div>
    </div>
  )
}