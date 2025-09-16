export interface VoiceWorkout {
  id?: string
  user_id?: string
  date: string
  audio_file_url?: string
  raw_transcription?: string
  parsed_workout_data?: ParsedWorkoutData
  transcription_confidence?: number
  voice_notes?: string
  created_at?: string
  updated_at?: string
}

export interface ParsedWorkoutData {
  workout_type?: string
  duration?: number
  sets?: WorkoutSet[]
  rating?: number
  sentiment?: 'positive' | 'neutral' | 'negative'
  confidence_score?: number
}

export interface WorkoutSet {
  type: string
  distance?: number
  time?: string
  repetitions?: number
  notes?: string
}

export interface AudioRecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob?: Blob
  mediaRecorder?: MediaRecorder
  stream?: MediaStream
}

export interface VoiceWorkoutAnalysis {
  transcription: string;
  analysis: string;
  editHistory?: {
    transcriptionEdits: number;
    analysisEdits: number;
    lastEditedAt: string;
  };
}

export interface VoiceUploadResponse {
  success: boolean;
  transcription?: string;
  analysis?: string;
  error?: string;
}
