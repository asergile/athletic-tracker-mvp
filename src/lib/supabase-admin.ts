import { createClient } from '@supabase/supabase-js'

// Server-side admin client for API routes only
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Initialize audio storage bucket
export async function createAudioBucket() {
  try {
    const { data, error } = await supabaseAdmin.storage.createBucket('workout-audio', {
      public: false,
      allowedMimeTypes: ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg'],
      fileSizeLimit: 10485760, // 10MB limit (3 minutes should be ~1-3MB)
    })
    
    if (error && error.message !== 'The resource already exists') {
      console.error('Error creating audio bucket:', error)
      return { success: false, error }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Failed to create audio bucket:', error)
    return { success: false, error }
  }
}
