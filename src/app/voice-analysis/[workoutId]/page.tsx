'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { getUserWorkouts } from '../../../lib/workouts'
import VoiceRecorder from '../../../components/VoiceRecorder'
import { ArrowLeft, Calendar, Clock, Target, Edit2 } from 'lucide-react'

interface Workout {
  id: string
  user_id: string
  workout_type: string
  duration: number
  rating: 1 | 2 | 3
  date: string
  distance?: number
  distance_unit?: string
  voice_transcription?: string
  workout_analysis?: any
  created_at: string
}

const ratingLabels = {
  1: { label: 'Rough', emoji: '😤', color: 'from-red-500 to-red-600' },
  2: { label: 'Decent', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
  3: { label: 'Great', emoji: '🔥', color: 'from-green-500 to-emerald-600' }
}

const formatTime = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}m`
}

export default function VoiceAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const workoutId = params.workoutId as string

  // State management - copying from voice-test
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [transcriptionResult, setTranscriptionResult] = useState<string>('')
  const [workoutAnalysis, setWorkoutAnalysis] = useState<any>(null)
  const [analysisSummary, setAnalysisSummary] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedTranscription, setEditedTranscription] = useState<string>('')
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false)
  const [editedAnalysis, setEditedAnalysis] = useState<string>('')

  // Load workout data on mount
  useEffect(() => {
    if (user && workoutId) {
      loadWorkout()
    }
  }, [user, workoutId])

  const loadWorkout = async () => {
    if (!user || !workoutId) return

    try {
      // Get specific workout by ID using getUserWorkouts function like voice-test page
      const userWorkouts = await getUserWorkouts(user.id, 100)
      const foundWorkout = userWorkouts?.find(w => w.id === workoutId)
      
      if (foundWorkout) {
        setWorkout(foundWorkout)
        
        // Load existing voice data if available
        if (foundWorkout.voice_transcription) {
          setTranscriptionResult(foundWorkout.voice_transcription)
        }
        if (foundWorkout.workout_analysis) {
          setWorkoutAnalysis(foundWorkout.workout_analysis)
        }
      } else {
        setError('Workout not found')
      }
    } catch (err) {
      console.error('Error loading workout:', err)
      setError('Failed to load workout')
    }
  }

  // Voice upload handler - copying from voice-test
  const handleVoiceUpload = async (audioBlob: Blob) => {
    if (!workoutId || !user) {
      setError('No workout found for voice note')
      return
    }

    setIsUploading(true)
    setError('')
    setTranscriptionResult('')

    try {
      // Get auth token - copying from voice-test approach
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      // Create form data - copying from voice-test approach
      const formData = new FormData()
      formData.append('audio', audioBlob, 'workout-voice-note.webm')
      formData.append('workoutId', workoutId)

      // Upload and transcribe - copying from voice-test approach
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
      
      // Refresh workout to show updated transcription
      await loadWorkout()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Edit transcription handler - copying from voice-test
  const handleEditTranscription = () => {
    setEditedTranscription(transcriptionResult)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedTranscription('')
  }

  const handleSaveEdit = async () => {
    if (!workoutId || !user || !editedTranscription.trim()) {
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
          workoutId: workoutId,
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
      
      // Refresh workout
      await loadWorkout()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-analysis failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Edit analysis handler - copying from voice-test
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
    if (!workoutId || !user || !editedAnalysis.trim()) {
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
          workoutId: workoutId,
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
      
      // Refresh workout
      await loadWorkout()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis update failed')
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-lg text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  if (!workout && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-lg text-white">Loading workout...</div>
      </div>
    )
  }

  const ratingConfig = workout ? ratingLabels[workout.rating] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Voice Analysis</h1>
            <p className="text-purple-200">Detailed workout breakdown</p>
          </div>
          <div className="w-12" /> {/* Spacer for center alignment */}
        </div>

        {/* Workout Details Card */}
        {workout && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{workout.workout_type}</h2>
                <div className="flex items-center space-x-4 text-gray-600 mt-2">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(workout.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(workout.duration)}</span>
                  </div>
                  {workout.distance && (
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>{workout.distance} {workout.distance_unit}</span>
                    </div>
                  )}
                </div>
              </div>
              {ratingConfig && (
                <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${ratingConfig.color} text-white font-semibold flex items-center space-x-2`}>
                  <span>{ratingConfig.emoji}</span>
                  <span>{ratingConfig.label}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 pb-8">
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-xl p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Voice Recording Section - only show if no transcription exists */}
        {!transcriptionResult && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Voice Note</h3>
            
            {isUploading && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                Uploading and transcribing audio...
              </div>
            )}

            <VoiceRecorder
              onRecordingComplete={handleVoiceUpload}
              disabled={isUploading}
            />
          </div>
        )}

        {/* Transcription Result */}
        {transcriptionResult && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Transcription Result</h3>
              {!isEditing && (
                <button
                  onClick={handleEditTranscription}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isUploading}
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit & Re-analyze</span>
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

        {/* AI Workout Analysis */}
        {workoutAnalysis && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">AI Workout Analysis</h3>
              {!isEditingAnalysis && workoutAnalysis.markdownAnalysis && (
                <button
                  onClick={handleEditAnalysis}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isUploading}
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Analysis</span>
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

        {/* Back to Dashboard Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
