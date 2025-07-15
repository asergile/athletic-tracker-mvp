export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          sport: string
          team_id: string | null
          coach_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          sport: string
          team_id?: string | null
          coach_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          sport?: string
          team_id?: string | null
          coach_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          date: string
          duration_minutes: number
          distance_yards: number | null
          workout_type: string
          rating: number
          notes: string | null
          voice_transcript: string | null
          processed_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          duration_minutes: number
          distance_yards?: number | null
          workout_type: string
          rating: number
          notes?: string | null
          voice_transcript?: string | null
          processed_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          duration_minutes?: number
          distance_yards?: number | null
          workout_type?: string
          rating?: number
          notes?: string | null
          voice_transcript?: string | null
          processed_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          sport: string
          coach_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sport: string
          coach_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sport?: string
          coach_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
