import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio, parseWorkoutDescription } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Step 1: Transcribe the audio
    console.log('Transcribing audio file:', audioFile.name, audioFile.size, 'bytes')
    const transcript = await transcribeAudio(audioFile)
    
    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not transcribe audio - please try speaking more clearly' },
        { status: 400 }
      )
    }

    // Step 2: Parse the workout description
    console.log('Parsing transcript:', transcript.substring(0, 100) + '...')
    const parseResult = await parseWorkoutDescription(transcript)
    
    // Add the transcript to the response
    const response = {
      ...parseResult,
      transcript,
      processing_time: new Date().toISOString()
    }

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error processing voice recording:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process voice recording',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle CORS for development
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
