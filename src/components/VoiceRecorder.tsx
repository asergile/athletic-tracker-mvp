'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VoiceRecording } from '@/types'

interface VoiceRecorderProps {
  onRecordingComplete: (recording: VoiceRecording) => void
  disabled?: boolean
}

export function VoiceRecorder({ onRecordingComplete, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [canPlayback, setCanPlayback] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const updateDuration = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current
      setDuration(Math.floor(elapsed / 1000))
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000 // Optimized for speech recognition
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setCanPlayback(true)
        
        // Stop all tracks to turn off microphone
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      startTimeRef.current = Date.now()
      pausedTimeRef.current = 0
      
      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
      
      // Start duration timer
      intervalRef.current = setInterval(updateDuration, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      pausedTimeRef.current += Date.now() - (startTimeRef.current + pausedTimeRef.current)
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      startTimeRef.current = Date.now() - duration * 1000
      
      intervalRef.current = setInterval(updateDuration, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const submitRecording = () => {
    if (audioBlob) {
      const recording: VoiceRecording = {
        id: `recording_${Date.now()}`,
        blob: audioBlob,
        duration: duration,
        created_at: new Date()
      }
      
      onRecordingComplete(recording)
      
      // Reset state
      setAudioBlob(null)
      setCanPlayback(false)
      setDuration(0)
    }
  }

  const discardRecording = () => {
    setAudioBlob(null)
    setCanPlayback(false)
    setDuration(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (canPlayback) {
    return (
      <div className="space-y-4 p-6 bg-white rounded-lg border">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Recording Complete</h3>
          <p className="text-gray-600">Duration: {formatTime(duration)}</p>
        </div>
        
        <div className="flex gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={discardRecording}
            className="px-6"
          >
            Discard
          </Button>
          <Button 
            onClick={submitRecording}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            Process Workout
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 text-center">
          This will send your recording for AI processing
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          {isRecording ? 'Recording Workout...' : 'Record Your Workout'}
        </h3>
        <p className="text-gray-600">
          {isRecording 
            ? `${formatTime(duration)} • Describe your workout naturally`
            : 'Tap the mic and describe what you did today'
          }
        </p>
      </div>

      <div className="flex justify-center">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={disabled}
            size="lg"
            className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-700 p-0"
          >
            <Mic className="h-8 w-8 text-white" />
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button
              onClick={isPaused ? resumeRecording : pauseRecording}
              size="lg"
              variant="outline"
              className="h-16 w-16 rounded-full p-0"
            >
              {isPaused ? (
                <Play className="h-6 w-6" />
              ) : (
                <Pause className="h-6 w-6" />
              )}
            </Button>
            
            <Button
              onClick={stopRecording}
              size="lg"
              className="h-16 w-16 rounded-full bg-gray-600 hover:bg-gray-700 p-0"
            >
              <Square className="h-6 w-6 text-white" />
            </Button>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-800">
              {isPaused ? 'Paused' : 'Recording'}
            </span>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>💡 Tip: Speak naturally - "We did 8 25s fly drill on 40 seconds"</p>
        <p>The AI will organize everything into sets and calculate distances</p>
      </div>
    </div>
  )
}
