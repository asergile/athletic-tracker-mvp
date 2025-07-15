import OpenAI from 'openai'
import { WorkoutParsingResult, ProcessedWorkoutData } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    })
    
    return transcription.text
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw new Error('Failed to transcribe audio')
  }
}

export async function parseWorkoutDescription(transcript: string): Promise<WorkoutParsingResult> {
  const prompt = `
You are an expert swimming coach analyzing a voice-recorded workout description. 
Parse the following transcript and extract structured workout data.

TRANSCRIPT: "${transcript}"

Please analyze this transcript and return a JSON object with the following structure:
{
  "success": boolean,
  "confidence": number (0-1),
  "workout_data": {
    "sets": [
      {
        "type": "warmup|main|cooldown|drill",
        "distance": number (in yards),
        "description": "string description",
        "repetitions": number (if applicable),
        "interval": "string (e.g., '1:00', '45s')",
        "stroke": "freestyle|backstroke|breaststroke|butterfly|IM|kick|drill",
        "intensity": "easy|moderate|hard|sprint"
      }
    ],
    "stroke_distribution": {
      "freestyle": number (percentage),
      "backstroke": number,
      "breaststroke": number,
      "butterfly": number,
      "IM": number,
      "kick": number,
      "drill": number
    },
    "achievements": ["string array of notable accomplishments"],
    "technical_focus": ["string array of technique points"]
  },
  "requires_review": boolean,
  "errors": ["array of potential issues or uncertainties"]
}

PARSING RULES:
1. Convert spoken numbers to proper formats ("825's" = "8x25", "two times 50" = "2x50")
2. Calculate total distances from set components
3. Identify workout phases (warmup, main sets, cooldown)
4. Extract time intervals and rest periods
5. Recognize swimming terminology (strokes, equipment, techniques)
6. Flag for manual review if confidence < 0.7 or critical data is unclear
7. Look for achievements like personal records, fast times, or accomplishments
8. Identify technical focus areas mentioned in the description

Focus on accuracy over completeness. If something is unclear, mark it for review.
`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a swimming workout analysis expert. Parse voice transcripts into structured data with high accuracy. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent, accurate parsing
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    try {
      const parsed = JSON.parse(response) as WorkoutParsingResult
      return parsed
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      return {
        success: false,
        confidence: 0,
        requires_review: true,
        errors: ['Failed to parse AI response - manual review required']
      }
    }
  } catch (error) {
    console.error('Error processing workout with OpenAI:', error)
    return {
      success: false,
      confidence: 0,
      requires_review: true,
      errors: ['OpenAI processing failed - manual review required']
    }
  }
}

export async function generateWorkoutSummary(workoutData: ProcessedWorkoutData): Promise<string> {
  const prompt = `
Create a concise, motivating summary of this workout data:

${JSON.stringify(workoutData, null, 2)}

Generate a 1-2 sentence summary that highlights:
- Total distance/duration
- Primary focus or achievement
- Notable performance metrics

Make it encouraging but factual. Example: "Solid 3,050-yard practice focused on IM technique with strong sprint work from the blocks. Great effort on the descending sets!"
`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive swimming coach providing brief, encouraging workout summaries.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 150,
    })

    return completion.choices[0]?.message?.content || 'Great workout completed!'
  } catch (error) {
    console.error('Error generating workout summary:', error)
    return 'Workout logged successfully!'
  }
}
