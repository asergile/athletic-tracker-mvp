'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUserWorkouts, createWorkout, type Workout } from '@/lib/workouts'
import VoiceRecorder from '@/components/VoiceRecorder'
import { supabase } from '@/lib/supabase.js'

export default function VoiceTestPage() {
  const { user, loading, signIn, signOut } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<string>('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<string>('')
  const [workoutAnalysis, setWorkoutAnalysis] = useState<any>(null)
  const [analysisSummary, setAnalysisSummary] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedTranscription, setEditedTranscription] = useState<string>('')
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false)
  const [editedAnalysis, setEditedAnalysis] = useState<string>('')

  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // New workout form state
  const [newWorkout, setNewWorkout] = useState({
    workout_type: '',
    duration: '',
    rating: '2',
    distance: '',
    distance_unit: 'miles'
  })

  useEffect(() => {
    if (user) {
      loadWorkouts()
    }
  }, [user])

  // Load workout data when selection changes
  useEffect(() => {
    setTranscriptionResult('')
    setWorkoutAnalysis(null)
    setAnalysisSummary('')
    setError('')
    setIsEditing(false)
    setEditedTranscription('')
    setIsEditingAnalysis(false)
    setEditedAnalysis('')
    
    // Load existing data for selected workout
    if (selectedWorkout) {
      const workout = workouts.find(w => w.id === selectedWorkout)
      if (workout) {
        if (workout.voice_transcription) {
          setTranscriptionResult(workout.voice_transcription)
        }
        if (workout.workout_analysis) {
          setWorkoutAnalysis(workout.workout_analysis)
        }
      }
    }
  }, [selectedWorkout, workouts])

  const loadWorkouts = async () => {
    if (!user) return
    const userWorkouts = await getUserWorkouts(user.id, 20)
    setWorkouts(userWorkouts)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    
    const { error } = await signIn(email, password)
    if (error) {
      setLoginError(error.message)
    }
  }

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const workout = await createWorkout({
      user_id: user.id,
      workout_type: newWorkout.workout_type,
      duration: parseInt(newWorkout.duration),
      rating: parseInt(newWorkout.rating) as 1 | 2 | 3,
      date: new Date().toISOString().split('T')[0],
      distance: newWorkout.distance ? parseFloat(newWorkout.distance) : undefined,
      distance_unit: newWorkout.distance ? newWorkout.distance_unit : undefined,
    })

    if (workout) {
      setWorkouts([workout, ...workouts])
      setSelectedWorkout(workout.id)
      setShowCreateForm(false)
      setNewWorkout({
        workout_type: '',
        duration: '',
        rating: '2',
        distance: '',
        distance_unit: 'miles'
      })
    }
  }

  const handleVoiceUpload = async (audioBlob: Blob) => {
    if (!selectedWorkout || !user) {
      setError('Please select a workout first')
      return
    }

    setIsUploading(true)
    setError('')
    setTranscriptionResult('')

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      // Create form data
      const formData = new FormData()
      formData.append('audio', audioBlob, 'workout-voice-note.webm')
      formData.append('workoutId', selectedWorkout)

      // Upload and transcribe
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setTranscriptionResult(result.transcription)
      setWorkoutAnalysis(result.workoutAnalysis)
      setAnalysisSummary(result.analysisSummary)
      
      // Refresh workouts to show updated transcription
      await loadWorkouts()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleEditTranscription = () => {
    setEditedTranscription(transcriptionResult)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedTranscription('')
  }

  const handleSaveEdit = async () => {
    if (!selectedWorkout || !user || !editedTranscription.trim()) {
      setError('Cannot save empty transcription')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      // Send edited transcription for re-analysis
      const response = await fetch('/api/reanalyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workoutId: selectedWorkout,
          transcription: editedTranscription
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Re-analysis failed')
      }

      // Update state with new analysis
      setTranscriptionResult(editedTranscription)
      setWorkoutAnalysis(result.workoutAnalysis)
      setAnalysisSummary(result.analysisSummary)
      setIsEditing(false)
      setEditedTranscription('')
      
      // Refresh workouts
      await loadWorkouts()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-analysis failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleEditAnalysis = () => {
    if (workoutAnalysis?.markdownAnalysis) {
      setEditedAnalysis(workoutAnalysis.markdownAnalysis)
      setIsEditingAnalysis(true)
    }
  }

  const handleCancelAnalysisEdit = () => {
    setIsEditingAnalysis(false)
    setEditedAnalysis('')
  }

  const handleSaveAnalysisEdit = async () => {
    if (!selectedWorkout || !user || !editedAnalysis.trim()) {
      setError('Cannot save empty analysis')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      // Send edited analysis for saving
      const response = await fetch('/api/update-analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workoutId: selectedWorkout,
          analysis: editedAnalysis
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Analysis update failed')
      }

      // Update state with edited analysis
      const updatedAnalysis = {
        ...workoutAnalysis,
        markdownAnalysis: editedAnalysis
      }
      setWorkoutAnalysis(updatedAnalysis)
      setIsEditingAnalysis(false)
      setEditedAnalysis('')
      
      // Refresh workouts
      await loadWorkouts()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis update failed')
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Voice Test Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Login with your test user credentials
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            {loginError && (
              <div className="text-red-600 text-sm text-center">{loginError}</div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Voice Test Page</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Logged in as: {user.email}
            </span>
            <button
              onClick={signOut}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Workout Selection */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Workout</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recent Workouts
              </label>
              <select
                value={selectedWorkout}
                onChange={(e) => setSelectedWorkout(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a workout...</option>
                {workouts.map((workout) => (
                  <option key={workout.id} value={workout.id}>
                    {workout.date} - {workout.workout_type} ({workout.duration}min) 
                    {workout.voice_transcription ? ' ✅ Has transcription' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-center">
              <span className="text-gray-500">or</span>
            </div>

            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full py-2 px-4 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50"
            >
              {showCreateForm ? 'Cancel' : 'Create New Workout'}
            </button>
          </div>

          {/* Create Workout Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateWorkout} className="mt-6 space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">Create New Workout</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workout Type
                  </label>
                  <input
                    type="text"
                    required
                    value={newWorkout.workout_type}
                    onChange={(e) => setNewWorkout({...newWorkout, workout_type: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Running, Swimming, Cycling"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newWorkout.duration}
                    onChange={(e) => setNewWorkout({...newWorkout, duration: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating
                  </label>
                  <select
                    value={newWorkout.rating}
                    onChange={(e) => setNewWorkout({...newWorkout, rating: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="1">1 - Easy</option>
                    <option value="2">2 - Moderate</option>
                    <option value="3">3 - Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distance (optional)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      value={newWorkout.distance}
                      onChange={(e) => setNewWorkout({...newWorkout, distance: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0.0"
                    />
                    <select
                      value={newWorkout.distance_unit}
                      onChange={(e) => setNewWorkout({...newWorkout, distance_unit: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="miles">Miles</option>
                      <option value="km">KM</option>
                      <option value="meters">Meters</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Workout
              </button>
            </form>
          )}
        </div>

        {/* Voice Recording */}
        {selectedWorkout && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Voice Recording</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {isUploading && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                Uploading and transcribing audio...
              </div>
            )}

            <VoiceRecorder
              key={selectedWorkout} // This forces component reset when workout changes
              onRecordingComplete={handleVoiceUpload}
              disabled={isUploading}
            />
          </div>
        )}

        {/* Transcription Result */}
        {transcriptionResult && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Transcription Result</h2>
              {!isEditing && (
                <button
                  onClick={handleEditTranscription}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={isUploading}
                >
                  Edit & Re-analyze
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={editedTranscription}
                  onChange={(e) => setEditedTranscription(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Edit the transcription to fix any errors..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isUploading || !editedTranscription.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUploading ? 'Re-analyzing...' : 'Save & Re-analyze'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUploading}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">{transcriptionResult}</p>
              </div>
            )}
          </div>
        )}

        {/* Workout Analysis */}
        {workoutAnalysis && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">AI Workout Analysis</h2>
              {!isEditingAnalysis && workoutAnalysis.markdownAnalysis && (
                <button
                  onClick={handleEditAnalysis}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={isUploading}
                >
                  Edit Analysis
                </button>
              )}
            </div>
            
            {analysisSummary && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 font-medium">{analysisSummary}</p>
              </div>
            )}

            {isEditingAnalysis ? (
              <div className="space-y-4">
                <textarea
                  value={editedAnalysis}
                  onChange={(e) => setEditedAnalysis(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Edit the workout analysis markdown..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveAnalysisEdit}
                    disabled={isUploading || !editedAnalysis.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUploading ? 'Saving...' : 'Save Analysis'}
                  </button>
                  <button
                    onClick={handleCancelAnalysisEdit}
                    disabled={isUploading}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Display markdown analysis */}
                {workoutAnalysis.markdownAnalysis ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-gray-50 p-4 rounded border overflow-x-auto">
{workoutAnalysis.markdownAnalysis}
                    </pre>
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    No structured analysis available. Legacy format detected.
                  </div>
                )}
              </>
            )}

            {/* Error Display */}
            {workoutAnalysis.error && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800"><strong>Analysis Error:</strong> {workoutAnalysis.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
