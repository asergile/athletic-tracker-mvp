import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
    const { workoutId, analysis } = await request.json()

    if (!workoutId || !analysis) {
      return NextResponse.json({ error: 'Missing workoutId or analysis' }, { status: 400 })
    }

    // Verify workout belongs to user
    const { data: workout, error: workoutError } = await supabaseAdmin
      .from('workouts')
      .select('id, user_id, workout_analysis')
      .eq('id', workoutId)
      .eq('user_id', user.id)
      .single()

    if (workoutError || !workout) {
      return NextResponse.json({ error: 'Workout not found or access denied' }, { status: 404 })
    }

    // Update the analysis with the edited markdown
    const updatedAnalysis = {
      ...workout.workout_analysis,
      markdownAnalysis: analysis,
      analysisType: 'markdown_format',
      lastEdited: new Date().toISOString()
    }

    // Update workout with new analysis
    const { error: updateError } = await supabaseAdmin
      .from('workouts')
      .update({ 
        workout_analysis: updatedAnalysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', workoutId)

    if (updateError) {
      console.error('Failed to update workout analysis:', updateError)
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      workoutId: workoutId,
      analysis: updatedAnalysis
    })

  } catch (error) {
    console.error('Update analysis API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
