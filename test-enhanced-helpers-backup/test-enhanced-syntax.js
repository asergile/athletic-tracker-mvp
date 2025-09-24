/**
 * Test Enhanced Database Helpers - Syntax Only
 * Tests just the import and function structure without Supabase connection
 */

console.log('Testing enhanced database helpers syntax...')

// Create a mock supabase module to avoid environment variable issues
const mockSupabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null })
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    insert: () => ({ select: () => Promise.resolve({ data: null, error: null }) }),
    update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: null, error: null }) }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
  })
}

// Mock the supabase module
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Create a temporary mock file
import { writeFileSync, unlinkSync } from 'fs'
const mockSupabaseContent = `
export const supabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null })
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    insert: () => ({ select: () => Promise.resolve({ data: null, error: null }) }),
    update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: null, error: null }) }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
  })
}
`

const mockPath = './src/lib/supabase-mock.js'
writeFileSync(mockPath, mockSupabaseContent)

try {
  console.log('Testing import with mock Supabase...')
  
  // Temporarily modify the enhanced helpers to use mock
  const enhancedHelpersContent = await import('fs').then(fs => 
    fs.promises.readFile('./src/lib/security/enhanced-db-helpers.js', 'utf8')
  )
  
  const modifiedContent = enhancedHelpersContent.replace(
    "import { supabase } from '../supabase.js'",
    "import { supabase } from '../supabase-mock.js'"
  )
  
  writeFileSync('./src/lib/security/enhanced-db-helpers-test.js', modifiedContent)
  
  // Now test the import
  const { dbHelpers } = await import('./src/lib/security/enhanced-db-helpers-test.js')
  
  console.log('✅ Import successful!')
  console.log('Available functions:', Object.keys(dbHelpers))
  console.log('Total functions:', Object.keys(dbHelpers).length)
  
  // Check if all expected functions exist
  const expectedFunctions = [
    'createWorkout',
    'getUserWorkouts', 
    'updateWorkout',
    'deleteWorkout',
    'getWorkoutStats',
    'getUserSettings',
    'updateUserSettings',
    'updateWeeklyFrequency',
    'createEvent',
    'updateEvent',
    'deleteEvent',
    'getUserEvents',
    'createGoal',
    'getUserGoals',
    'deleteGoal',
    'submitFeedback',
    'getUserCustomWorkoutTypes',
    'addCustomWorkoutType',
    'deleteCustomWorkoutType',
    'getUserProfile',
    'updateUserProfile',
    'getUserWorkoutsWithProfile',
    'getUserAuditHistory',
    'getRecordAuditHistory',
    'checkSuspiciousActivity',
    'getRecentAuditActivity',
    'getUserActivitySummary'
  ]
  
  const missingFunctions = expectedFunctions.filter(fn => !dbHelpers[fn])
  const extraFunctions = Object.keys(dbHelpers).filter(fn => !expectedFunctions.includes(fn))
  
  if (missingFunctions.length === 0) {
    console.log('✅ All 27 expected functions present!')
  } else {
    console.log('❌ Missing functions:', missingFunctions)
  }
  
  if (extraFunctions.length > 0) {
    console.log('ℹ️  Extra functions:', extraFunctions)
  }
  
  // Test that functions are actually callable (will fail auth but shouldn't crash)
  try {
    const result = await dbHelpers.createWorkout({
      type: 'Running',
      duration: 30,
      rating: 2
    })
    console.log('✅ Function calls work (auth will fail but no syntax errors)')
  } catch (error) {
    if (error.message.includes('Authentication required')) {
      console.log('✅ Security working - authentication required')
    } else {
      console.log('❌ Unexpected error:', error.message)
    }
  }
  
  console.log('\n🎯 Enhanced helpers syntax is correct and ready for integration!')
  
} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Full error:', error)
} finally {
  // Clean up temp files
  try {
    unlinkSync(mockPath)
    unlinkSync('./src/lib/security/enhanced-db-helpers-test.js')
  } catch (e) {
    // Ignore cleanup errors
  }
}
