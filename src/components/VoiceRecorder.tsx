'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react'
import { AudioRecorder, formatDuration, createAudioURL, revokeAudioURL } from '@/lib/audio-utils'
import { AudioRecordingState, VoiceUploadResponse } from '@/types/voice-workout'

interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void
  maxDuration?: number // in seconds
  disabled?: boolean
}

export default function VoiceRecorder({ 
  onRecordingComplete,
  maxDuration = 300, // 5 minutes default
  disabled = false
}: VoiceRecorderProps) {
  const [state, setState] = useState<AudioRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: undefined,
    mediaRecorder: undefined,
    stream: undefined
  })

  const [audioURL, setAudioURL] = useState<string>('')
  const [error, setError] = useState<string>('')
  
  const recorderRef = useRef<AudioRecorder | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize recorder
  useEffect(() => {
    recorderRef.current = new AudioRecorder()
    return () => {
      // Cleanup on unmount
      if (audioURL) revokeAudioURL(audioURL)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [audioURL])

  // Duration timer
  useEffect(() => {
    if (state.isRecording && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const newDuration = prev.duration + 1
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            handleStopRecording()
            return prev
          }
          return { ...prev, duration: newDuration }
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.isRecording, state.isPaused, maxDuration])

  const handleStartRecording = async () => {
    try {
      setError('')
      await recorderRef.current?.startRecording()
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false, 
        duration: 0,
        audioBlob: undefined 
      }))
      // Clear previous recording
      if (audioURL) {
        revokeAudioURL(audioURL)
        setAudioURL('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }

  const handleStopRecording = async () => {
    try {
      const audioBlob = await recorderRef.current?.stopRecording()
      if (audioBlob) {
        const url = createAudioURL(audioBlob)
        setAudioURL(url)
        setState(prev => ({ 
          ...prev, 
          isRecording: false, 
          isPaused: false, 
          audioBlob 
        }))
        // Auto-trigger analysis when recording completes
        onRecordingComplete?.(audioBlob)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording')
    }
  }

  const handlePauseRecording = () => {
    recorderRef.current?.pauseRecording()
    setState(prev => ({ ...prev, isPaused: true }))
  }

  const handleResumeRecording = () => {
    recorderRef.current?.resumeRecording()
    setState(prev => ({ ...prev, isPaused: false }))
  }

  const handleClearRecording = () => {
    if (audioURL) {
      revokeAudioURL(audioURL)
      setAudioURL('')
    }
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: undefined
    })
  }



  const isMaxDurationReached = state.duration >= maxDuration

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Voice Recording
          </h3>
          <div className="text-sm text-gray-500">
            {formatDuration(state.duration)} / {formatDuration(maxDuration)}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex items-center gap-3 mb-4">
          {!state.isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={isMaxDurationReached || disabled}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mic size={20} />
              Start Recording
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Square size={20} />
                Stop
              </button>
              
              {state.isPaused ? (
                <button
                  onClick={handleResumeRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Play size={20} />
                  Resume
                </button>
              ) : (
                <button
                  onClick={handlePauseRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Pause size={20} />
                  Pause
                </button>
              )}
            </div>
          )}

          {state.audioBlob && (
            <button
              onClick={handleClearRecording}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <Trash2 size={18} />
              Clear
            </button>
          )}
        </div>

        {/* Recording Status */}
        {state.isRecording && (
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${state.isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-sm text-gray-600">
              {state.isPaused ? 'Recording paused' : 'Recording...'}
            </span>
          </div>
        )}

        {/* Audio Playback */}
        {audioURL && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Recorded audio:</p>
            <audio 
              controls 
              src={audioURL} 
              className="w-full"
              preload="metadata"
            />
            <p className="text-xs text-gray-500 mt-2">
              Duration: {formatDuration(state.duration)}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(state.duration / maxDuration) * 100}%` }}
            />
          </div>
        </div>
    </div>
  )
}
