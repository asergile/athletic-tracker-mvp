import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Anthropic from '@anthropic-ai/sdk'
import { PromptManager } from '@/lib/prompt-manager'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Process workout transcript into structured data (shares the same prompt
// source as the initial upload route - see /prompts/workout-processing/current.md)
async function processWorkoutTranscript(transcript: string): Promise<{
  structuredWorkout: any;
  summary: string;
}> {
  let basePrompt: string;
  try {
    basePrompt = await PromptManager.loadPrompt('workout-processing');
  } catch (error) {
    console.error('Failed to load workout processing prompt:', error);
    throw new Error('Prompt loading failed');
  }

  const WORKOUT_ANALYSIS_PROMPT = `${basePrompt}

TRANSCRIPT:
${transcript}`;

  try {
    const completion = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
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

    // Check if LLM rejected the transcript as having no connection to training
    if (analysisText.trim() === 'NO_WORKOUT_DETECTED') {
      throw new Error('TRANSCRIPT_NOT_WORKOUT');
    }

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

    // Special handling for rejected transcripts with no connection to training
    if (error instanceof Error && error.message === 'TRANSCRIPT_NOT_WORKOUT') {
      return {
        structuredWorkout: {
          markdownAnalysis: `# Not a Workout\n\nThe voice note did not contain workout or training information.\n\n**Raw Transcript:**\n${transcript}`,
          rawTranscript: transcript,
          analysisType: 'rejected',
          error: 'NO_WORKOUT_DETECTED'
        },
        summary: 'Not a workout (no training information detected)'
      };
    }

    // Fallback for other errors
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

    // Parse request body
    const { workoutId, transcription } = await request.json()

    if (!workoutId || !transcription) {
      return NextResponse.json({ error: 'Missing workoutId or transcription' }, { status: 400 })
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

    // Update workout with corrected transcription and new analysis
    const { error: updateError } = await supabaseAdmin
      .from('workouts')
      .update({ 
        voice_transcription: transcription,
        workout_analysis: workoutAnalysis.structuredWorkout,
        updated_at: new Date().toISOString()
      })
      .eq('id', workoutId)

    if (updateError) {
      console.error('Failed to update workout with corrected analysis:', updateError)
      return NextResponse.json({ error: 'Failed to save corrected analysis' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transcription: transcription,
      workoutAnalysis: workoutAnalysis.structuredWorkout,
      analysisSummary: workoutAnalysis.summary,
      workoutId: workoutId
    })

  } catch (error) {
    console.error('Re-analysis API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
