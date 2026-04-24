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
      clients: {
        Row: {
          id: string
          created_at: string
          full_name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          gender: string | null
          city: string | null
          occupation: string | null
          start_date: string | null
          current_week: number
          phase: string
          risk_status: string
          client_type: string
          status: string
          coach_notes: string | null
          identity_card_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      body_metrics: {
        Row: {
          id: string
          client_id: string
          recorded_at: string
          height_inches: number | null
          weight_kg: number | null
          waist_inches: number | null
          chest_inches: number | null
          hip_inches: number | null
          target_weight_kg: number | null
          primary_goal: string | null
        }
        Insert: Omit<Database['public']['Tables']['body_metrics']['Row'], 'id' | 'recorded_at'>
        Update: Partial<Database['public']['Tables']['body_metrics']['Insert']>
      }
      medical_history: {
        Row: {
          id: string
          client_id: string
          conditions: string[] | null
          injuries: string | null
          medications: string | null
          recent_surgery: boolean
          doctors_care: string | null
        }
        Insert: Omit<Database['public']['Tables']['medical_history']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['medical_history']['Insert']>
      }
      fitness_background: {
        Row: {
          id: string
          client_id: string
          fitness_level: string | null
          environments: string[] | null
          training_days: number | null
          session_duration: string | null
          current_activities: string | null
        }
        Insert: Omit<Database['public']['Tables']['fitness_background']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['fitness_background']['Insert']>
      }
      lifestyle: {
        Row: {
          id: string
          client_id: string
          sleep_duration: string | null
          sleep_quality: string | null
          stress_level: number | null
          stress_sources: string[] | null
          day_in_life: string | null
          daily_steps: string | null
        }
        Insert: Omit<Database['public']['Tables']['lifestyle']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['lifestyle']['Insert']>
      }
      nutrition: {
        Row: {
          id: string
          client_id: string
          diet_preference: string | null
          allergies: string | null
          disliked_foods: string | null
          meals_per_day: string | null
          eating_out_frequency: string | null
          digestion_issues: string[] | null
          water_intake: string | null
        }
        Insert: Omit<Database['public']['Tables']['nutrition']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['nutrition']['Insert']>
      }
      hormonal_health: {
        Row: {
          id: string
          client_id: string
          cycle_regularity: string | null
          mood_fluctuations: string | null
          hormonal_conditions: string | null
          additional_context: string | null
        }
        Insert: Omit<Database['public']['Tables']['hormonal_health']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['hormonal_health']['Insert']>
      }
      psychology: {
        Row: {
          id: string
          client_id: string
          previous_attempts: string | null
          why_didnt_last: string | null
          readiness_score: number | null
          willingness_score: number | null
          biggest_fear: string | null
          support_system: string[] | null
        }
        Insert: Omit<Database['public']['Tables']['psychology']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['psychology']['Insert']>
      }
      expectations: {
        Row: {
          id: string
          client_id: string
          success_3_months: string | null
          success_12_months: string | null
          referral_source: string | null
          anything_else: string | null
        }
        Insert: Omit<Database['public']['Tables']['expectations']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['expectations']['Insert']>
      }
      identity_cards: {
        Row: {
          id: string
          client_id: string
          created_at: string
          surface_goal: string | null
          deep_why: string | null
          life_vision: string | null
          identity_person: string | null
          values: string[] | null
          obstacle: string | null
          identity_statement: string | null
          reengagement_anchor: string | null
          personal_commitment: string | null
          coach_notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['identity_cards']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['identity_cards']['Insert']>
      }
      weekly_checkins: {
        Row: {
          id: string
          client_id: string
          week_number: number | null
          submitted_at: string
          weight_kg: number | null
          waist_inches: number | null
          lower_belly_inches: number | null
          thigh_inches: number | null
          daily_steps: number | null
          health_issues: string | null
          workouts_completed: number | null
          workout_intensity: string | null
          nutrition_adherence: number | null
          water_intake: string | null
          meals_followed: string | null
          mood: string | null
          energy_level: number | null
          sleep_duration: string | null
          sleep_quality: string | null
          stress_level: number | null
          biggest_win: string | null
          biggest_challenge: string | null
          real_life_context: string | null
          mindset_answer: string | null
          why_connection: number | null
          needs_from_coach: string[] | null
          week_rating: number | null
          call_booked: boolean
          coach_notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['weekly_checkins']['Row'], 'id' | 'submitted_at'>
        Update: Partial<Database['public']['Tables']['weekly_checkins']['Insert']>
      }
      assessments: {
        Row: {
          id: string
          client_id: string
          assessment_number: number | null
          assessed_at: string
          environment: string | null
          endurance_result: number | null
          endurance_unit: string | null
          strength_reps: number | null
          flexibility_result: number | null
          mobility_result: number | null
          endurance_effort: string | null
          strength_effort: string | null
          flexibility_effort: string | null
          mobility_effort: string | null
          endurance_pain: string | null
          strength_pain: string | null
          flexibility_pain: string | null
          mobility_pain: string | null
          coach_notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['assessments']['Row'], 'id' | 'assessed_at'>
        Update: Partial<Database['public']['Tables']['assessments']['Insert']>
      }
      progress_photos: {
        Row: {
          id: string
          client_id: string
          uploaded_at: string
          week_number: number | null
          front_photo_url: string | null
          side_photo_url: string | null
          back_photo_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['progress_photos']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['progress_photos']['Insert']>
      }
      blood_work: {
        Row: {
          id: string
          client_id: string
          uploaded_at: string
          report_url: string | null
          coach_notes: string | null
          reviewed: boolean
        }
        Insert: Omit<Database['public']['Tables']['blood_work']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['blood_work']['Insert']>
      }
      retention_alerts: {
        Row: {
          id: string
          client_id: string
          created_at: string
          alert_type: string | null
          alert_message: string | null
          resolved: boolean
          resolved_at: string | null
          action_taken: string | null
        }
        Insert: Omit<Database['public']['Tables']['retention_alerts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['retention_alerts']['Insert']>
      }
    }
  }
}