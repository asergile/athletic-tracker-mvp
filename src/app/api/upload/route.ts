import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// AssemblyAI transcription function
async function transcribeWithAssemblyAI(audioFile: File): Promise<string> {
  const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY
  
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('AssemblyAI API key not configured')
  }

  // Step 1: Upload audio file to AssemblyAI
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
    },
    body: audioFile
  })

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.statusText}`)
  }

  const { upload_url } = await uploadResponse.json()

  // Step 2: Request transcription
  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      // Optimize for short workout notes
      speech_model: 'best',
      punctuate: true,
      format_text: true,
    })
  })

  if (!transcriptResponse.ok) {
    throw new Error(`Transcription request failed: ${transcriptResponse.statusText}`)
  }

  const { id } = await transcriptResponse.json()

  // Step 3: Poll for completion (AssemblyAI is async)
  let transcriptData
  let attempts = 0
  const maxAttempts = 60 // 5 minutes max wait

  while (attempts < maxAttempts) {
    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
      }
    })

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.statusText}`)
    }

    transcriptData = await statusResponse.json()

    if (transcriptData.status === 'completed') {
      return transcriptData.text || '[No speech detected]'
    } else if (transcriptData.status === 'error') {
      throw new Error(`Transcription failed: ${transcriptData.error}`)
    }

    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000))
    attempts++
  }

  throw new Error('Transcription timed out')
}

// Process workout transcript into structured data
async function processWorkoutTranscript(transcript: string): Promise<{
  structuredWorkout: any;
  summary: string;
}> {
  const WORKOUT_ANALYSIS_PROMPT = `You are a swimming workout processor. Convert the raw voice transcript into a clean, structured workout summary that the athlete will see and save. Output ONLY the formatted workout summary - no processing notes, confidence levels, or meta-commentary.

TRANSCRIPT:
${transcript}

REQUIRED OUTPUT FORMAT:
# [Athlete Name]'s Workout - [Date]
## WORKOUT STRUCTURE
### WARM-UP ([X] yards/meters total)
- [Clean, specific sets with distances]
### PRE-SET ([X] yards/meters total) 
[Only include if mentioned]
### MAIN SET ([X] yards/meters total)
- [Clean, specific sets with distances]
### COOL DOWN ([X] yards/meters total)
[Only include if mentioned]
## PERFORMANCE HIGHLIGHTS
- **[Stroke] [Distance]:** [Time] [context if mentioned]
- **[Notable achievement]:** [Description]
## WORKOUT METRICS
- **Total Distance:** [X] yards/meters
- **Course:** [Long course/Short course/Pool size if mentioned]
- **Equipment Used:** [List if mentioned: fins, paddles, snorkel, etc.]
- **Session Rating:** [X]/3 [with brief reason if given]
- **Primary Focus:** [Training type: aerobic, sprint, technique, etc.]
## TRAINING NOTES
[2-3 bullet points of athlete's key observations, feelings, or improvements mentioned]

RULES:
- Use athlete's exact times when mentioned
- Convert rambling descriptions into clean set structures
- Include equipment context when mentioned
- Calculate total distance accurately
- Keep athlete's own assessment/rating
- Only include sections that apply
- No processing confidence notes
- No suggestions or coaching advice
- Use athlete's preferred stroke terminology`;

  try {
    const completion = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: WORKOUT_ANALYSIS_PROMPT
        }
      ]
    });

    const analysisText = completion.content[0]?.type === 'text' ? completion.content[0].text : '';
    
    // Store the markdown analysis directly
    const structuredWorkout = {
      markdownAnalysis: analysisText,
      rawTranscript: transcript,
      analysisType: 'markdown_format'
    };

    // Create summary from the first line of analysis
    const firstLine = analysisText.split('\n')[0] || 'Workout analysis completed';
    const summary = firstLine.replace(/^#\s*/, ''); // Remove markdown header

    return {
      structuredWorkout,
      summary
    };

  } catch (error) {
    console.error('LLM analysis failed:', error);
    
    // Fallback to basic transcript storage
    return {
    structuredWorkout: {
    markdownAnalysis: `# Workout Analysis Failed\n\n**Raw Transcript:**\n${transcript}\n\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}`,
    rawTranscript: transcript,
    analysisType: 'fallback',
    error: error instanceof Error ? error.message : 'Unknown error'
    },
    summary: `Raw transcript (analysis failed): ${transcript.substring(0, 100)}...`
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    
    // Verify user with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const workoutId = formData.get('workoutId') as string

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    if (!workoutId) {
      return NextResponse.json({ error: 'No workout ID provided' }, { status: 400 })
    }

    // File size check (AssemblyAI has a 5GB limit, but let's be reasonable)
    const maxSizeBytes = 50 * 1024 * 1024 // 50MB
    if (audioFile.size > maxSizeBytes) {
      return NextResponse.json({ error: 'Audio file too large (max 50MB)' }, { status: 400 })
    }

    // Verify workout belongs to user
    const { data: workout, error: workoutError } = await supabaseAdmin
      .from('workouts')
      .select('id, user_id')
      .eq('id', workoutId)
      .eq('user_id', user.id)
      .single()

    if (workoutError || !workout) {
      return NextResponse.json({ error: 'Workout not found or access denied' }, { status: 404 })
    }

    // Transcribe audio with AssemblyAI
    let transcription: string
    try {
      transcription = await transcribeWithAssemblyAI(audioFile)
    } catch (transcriptionError) {
      console.error('AssemblyAI transcription failed:', transcriptionError)
      
      // Fallback to saving that audio was received but transcription failed
      const fallbackText = `[Voice note recorded at ${new Date().toLocaleString()}] - Transcription failed: ${transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'}`
      
      const { error: updateError } = await supabaseAdmin
        .from('workouts')
        .update({ 
          voice_transcription: fallbackText,
          updated_at: new Date().toISOString()
        })
        .eq('id', workoutId)

      if (updateError) {
        console.error('Failed to update workout with fallback:', updateError)
        return NextResponse.json({ error: 'Failed to save voice note' }, { status: 500 })
      }

      return NextResponse.json({
        success: false,
        transcription: fallbackText,
        workoutId: workoutId,
        error: 'Transcription failed but audio was received'
      }, { status: 500 })
    }

    // Process workout analysis with LLM
    let workoutAnalysis: { structuredWorkout: any; summary: string }
    try {
      workoutAnalysis = await processWorkoutTranscript(transcription)
    } catch (analysisError) {
      console.error('Workout analysis failed:', analysisError)
      // Continue with just transcription if analysis fails
      workoutAnalysis = {
        structuredWorkout: { error: 'Analysis failed' },
        summary: `Raw transcript: ${transcription.substring(0, 100)}...`
      }
    }

    // Update workout with transcription and analysis
    const { error: updateError } = await supabaseAdmin
      .from('workouts')
      .update({ 
        voice_transcription: transcription,
        workout_analysis: workoutAnalysis.structuredWorkout,
        updated_at: new Date().toISOString()
      })
      .eq('id', workoutId)

    if (updateError) {
      console.error('Failed to update workout with transcription:', updateError)
      return NextResponse.json({ error: 'Failed to save voice note' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transcription: transcription,
      workoutAnalysis: workoutAnalysis.structuredWorkout,
      analysisSummary: workoutAnalysis.summary,
      workoutId: workoutId,
      audioSize: audioFile.size,
      audioType: audioFile.type
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
