export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string | null
          candidate_id: string | null
          cover_letter: string | null
          id: string
          job_id: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          candidate_id?: string | null
          cover_letter?: string | null
          id?: string
          job_id?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          candidate_id?: string | null
          cover_letter?: string | null
          id?: string
          job_id?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_contact_consent: {
        Row: {
          application_id: string | null
          candidate_id: string
          company_id: string
          created_at: string | null
          granted_at: string | null
          granted_by_application: boolean | null
          id: string
          revoked_at: string | null
        }
        Insert: {
          application_id?: string | null
          candidate_id: string
          company_id: string
          created_at?: string | null
          granted_at?: string | null
          granted_by_application?: boolean | null
          id?: string
          revoked_at?: string | null
        }
        Update: {
          application_id?: string | null
          candidate_id?: string
          company_id?: string
          created_at?: string | null
          granted_at?: string | null
          granted_by_application?: boolean | null
          id?: string
          revoked_at?: string | null
        }
        Relationships: []
      }
      candidate_profiles: {
        Row: {
          archetype: string | null
          avatar_url: string | null
          career_goals: string | null
          cpf: string | null
          created_at: string | null
          current_position: string | null
          date_of_birth: string | null
          education: Json | null
          email: string | null
          full_name: string | null
          gender: string | null
          headline: string | null
          id: string
          key_achievements: string | null
          languages: Json | null
          linkedin_data: Json | null
          location: string | null
          phone: string | null
          pillar_scores: Json | null
          preferences: Json | null
          preferred_roles: Json | null
          resume_score: number | null
          skills: Json | null
          skills_vector: Json | null
          updated_at: string | null
          user_id: string
          validation_score: number | null
          years_experience: number | null
        }
        Insert: {
          archetype?: string | null
          avatar_url?: string | null
          career_goals?: string | null
          cpf?: string | null
          created_at?: string | null
          current_position?: string | null
          date_of_birth?: string | null
          education?: Json | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          headline?: string | null
          id?: string
          key_achievements?: string | null
          languages?: Json | null
          linkedin_data?: Json | null
          location?: string | null
          phone?: string | null
          pillar_scores?: Json | null
          preferences?: Json | null
          preferred_roles?: Json | null
          resume_score?: number | null
          skills?: Json | null
          skills_vector?: Json | null
          updated_at?: string | null
          user_id: string
          validation_score?: number | null
          years_experience?: number | null
        }
        Update: {
          archetype?: string | null
          avatar_url?: string | null
          career_goals?: string | null
          cpf?: string | null
          created_at?: string | null
          current_position?: string | null
          date_of_birth?: string | null
          education?: Json | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          headline?: string | null
          id?: string
          key_achievements?: string | null
          languages?: Json | null
          linkedin_data?: Json | null
          location?: string | null
          phone?: string | null
          pillar_scores?: Json | null
          preferences?: Json | null
          preferred_roles?: Json | null
          resume_score?: number | null
          skills?: Json | null
          skills_vector?: Json | null
          updated_at?: string | null
          user_id?: string
          validation_score?: number | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          cnpj: string | null
          company_culture: Json | null
          company_name: string
          created_at: string | null
          description: string | null
          employee_count: number | null
          founded_year: number | null
          id: string
          industry: string | null
          location: string | null
          logo_url: string | null
          size_category: string | null
          social_links: Json | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          cnpj?: string | null
          company_culture?: Json | null
          company_name: string
          created_at?: string | null
          description?: string | null
          employee_count?: number | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          size_category?: string | null
          social_links?: Json | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          cnpj?: string | null
          company_culture?: Json | null
          company_name?: string
          created_at?: string | null
          description?: string | null
          employee_count?: number | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          size_category?: string | null
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          age_ranges: Json | null
          archetype: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          education_levels: Json | null
          expires_at: string | null
          gender_preference: string | null
          id: string
          industries: Json | null
          location: string | null
          pillar_scores: Json | null
          preferred_institutions: Json | null
          priority_score: number | null
          requirements: Json | null
          salary_max: number | null
          salary_min: number | null
          skills_vector: Json | null
          status: Database["public"]["Enums"]["job_status"] | null
          technical_skills: Json | null
          title: string
          updated_at: string | null
          work_model: Database["public"]["Enums"]["work_model"] | null
        }
        Insert: {
          age_ranges?: Json | null
          archetype?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          education_levels?: Json | null
          expires_at?: string | null
          gender_preference?: string | null
          id?: string
          industries?: Json | null
          location?: string | null
          pillar_scores?: Json | null
          preferred_institutions?: Json | null
          priority_score?: number | null
          requirements?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          skills_vector?: Json | null
          status?: Database["public"]["Enums"]["job_status"] | null
          technical_skills?: Json | null
          title: string
          updated_at?: string | null
          work_model?: Database["public"]["Enums"]["work_model"] | null
        }
        Update: {
          age_ranges?: Json | null
          archetype?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          education_levels?: Json | null
          expires_at?: string | null
          gender_preference?: string | null
          id?: string
          industries?: Json | null
          location?: string | null
          pillar_scores?: Json | null
          preferred_institutions?: Json | null
          priority_score?: number | null
          requirements?: Json | null
          salary_max?: number | null
          salary_min?: number | null
          skills_vector?: Json | null
          status?: Database["public"]["Enums"]["job_status"] | null
          technical_skills?: Json | null
          title?: string
          updated_at?: string | null
          work_model?: Database["public"]["Enums"]["work_model"] | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_feedback: {
        Row: {
          candidate_id: string | null
          company_id: string | null
          created_at: string
          feedback: string
          id: string
          job_id: string | null
        }
        Insert: {
          candidate_id?: string | null
          company_id?: string | null
          created_at?: string
          feedback: string
          id?: string
          job_id?: string | null
        }
        Update: {
          candidate_id?: string | null
          company_id?: string | null
          created_at?: string
          feedback?: string
          id?: string
          job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_feedback_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_feedback_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_feedback_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_results: {
        Row: {
          calculated_at: string | null
          candidate_id: string | null
          expires_at: string | null
          explanation: string | null
          factors_analyzed: Json | null
          feedback_status: string | null
          id: string
          is_demo_match: boolean | null
          job_id: string | null
          match_percentage: number
          score_breakdown: Json
        }
        Insert: {
          calculated_at?: string | null
          candidate_id?: string | null
          expires_at?: string | null
          explanation?: string | null
          factors_analyzed?: Json | null
          feedback_status?: string | null
          id?: string
          is_demo_match?: boolean | null
          job_id?: string | null
          match_percentage: number
          score_breakdown: Json
        }
        Update: {
          calculated_at?: string | null
          candidate_id?: string | null
          expires_at?: string | null
          explanation?: string | null
          factors_analyzed?: Json | null
          feedback_status?: string | null
          id?: string
          is_demo_match?: boolean | null
          job_id?: string | null
          match_percentage?: number
          score_breakdown?: Json
        }
        Relationships: [
          {
            foreignKeyName: "matching_results_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_results_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          application_updates: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          match_notifications: boolean | null
          updated_at: string | null
          user_id: string | null
          weekly_digest: boolean | null
        }
        Insert: {
          application_updates?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          match_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          weekly_digest?: boolean | null
        }
        Update: {
          application_updates?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          match_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          weekly_digest?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_responses: {
        Row: {
          calculated_score: number | null
          candidate_id: string | null
          category: Database["public"]["Enums"]["questionnaire_category"]
          completion_time_seconds: number | null
          created_at: string | null
          id: string
          responses: Json
        }
        Insert: {
          calculated_score?: number | null
          candidate_id?: string | null
          category: Database["public"]["Enums"]["questionnaire_category"]
          completion_time_seconds?: number | null
          created_at?: string | null
          id?: string
          responses: Json
        }
        Update: {
          calculated_score?: number | null
          candidate_id?: string | null
          category?: Database["public"]["Enums"]["questionnaire_category"]
          completion_time_seconds?: number | null
          created_at?: string | null
          id?: string
          responses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_responses_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_responses_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_analyses: {
        Row: {
          ai_suggestions: Json | null
          candidate_id: string | null
          created_at: string | null
          experience_summary: Json | null
          extracted_data: Json | null
          file_url: string | null
          id: string
          original_filename: string | null
          overall_score: number | null
          processing_status: string | null
          skills_extracted: Json | null
          soft_skills_score: number | null
          technical_score: number | null
          version: number | null
        }
        Insert: {
          ai_suggestions?: Json | null
          candidate_id?: string | null
          created_at?: string | null
          experience_summary?: Json | null
          extracted_data?: Json | null
          file_url?: string | null
          id?: string
          original_filename?: string | null
          overall_score?: number | null
          processing_status?: string | null
          skills_extracted?: Json | null
          soft_skills_score?: number | null
          technical_score?: number | null
          version?: number | null
        }
        Update: {
          ai_suggestions?: Json | null
          candidate_id?: string | null
          created_at?: string | null
          experience_summary?: Json | null
          extracted_data?: Json | null
          file_url?: string | null
          id?: string
          original_filename?: string | null
          overall_score?: number | null
          processing_status?: string | null
          skills_extracted?: Json | null
          soft_skills_score?: number | null
          technical_score?: number | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_analyses_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_analyses_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_embeddings: {
        Row: {
          aliases: string[] | null
          category: string | null
          created_at: string | null
          embedding: string | null
          id: string
          skill_name: string
        }
        Insert: {
          aliases?: string[] | null
          category?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          skill_name: string
        }
        Update: {
          aliases?: string[] | null
          category?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          skill_name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          active_profile: Database["public"]["Enums"]["profile_type"] | null
          created_at: string | null
          email: string
          id: string
          oauth_id: string | null
          oauth_provider: string | null
          profiles: Database["public"]["Enums"]["profile_type"][] | null
          updated_at: string | null
        }
        Insert: {
          active_profile?: Database["public"]["Enums"]["profile_type"] | null
          created_at?: string | null
          email: string
          id?: string
          oauth_id?: string | null
          oauth_provider?: string | null
          profiles?: Database["public"]["Enums"]["profile_type"][] | null
          updated_at?: string | null
        }
        Update: {
          active_profile?: Database["public"]["Enums"]["profile_type"] | null
          created_at?: string | null
          email?: string
          id?: string
          oauth_id?: string | null
          oauth_provider?: string | null
          profiles?: Database["public"]["Enums"]["profile_type"][] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      candidate_profiles_safe: {
        Row: {
          age_range: string | null
          archetype: string | null
          avatar_url: string | null
          career_goals: string | null
          cpf: string | null
          created_at: string | null
          current_position: string | null
          date_of_birth: string | null
          education: Json | null
          email: string | null
          full_name: string | null
          gender: string | null
          headline: string | null
          id: string | null
          key_achievements: string | null
          languages: Json | null
          linkedin_data: Json | null
          location: string | null
          phone: string | null
          pillar_scores: Json | null
          preferences: Json | null
          preferred_roles: Json | null
          resume_score: number | null
          skills: Json | null
          skills_vector: Json | null
          updated_at: string | null
          user_id: string | null
          validation_score: number | null
          years_experience: number | null
        }
        Insert: {
          age_range?: never
          archetype?: string | null
          avatar_url?: string | null
          career_goals?: string | null
          cpf?: never
          created_at?: string | null
          current_position?: string | null
          date_of_birth?: never
          education?: Json | null
          email?: never
          full_name?: never
          gender?: never
          headline?: string | null
          id?: string | null
          key_achievements?: string | null
          languages?: Json | null
          linkedin_data?: Json | null
          location?: string | null
          phone?: never
          pillar_scores?: Json | null
          preferences?: Json | null
          preferred_roles?: Json | null
          resume_score?: number | null
          skills?: Json | null
          skills_vector?: Json | null
          updated_at?: string | null
          user_id?: string | null
          validation_score?: number | null
          years_experience?: number | null
        }
        Update: {
          age_range?: never
          archetype?: string | null
          avatar_url?: string | null
          career_goals?: string | null
          cpf?: never
          created_at?: string | null
          current_position?: string | null
          date_of_birth?: never
          education?: Json | null
          email?: never
          full_name?: never
          gender?: never
          headline?: string | null
          id?: string | null
          key_achievements?: string | null
          languages?: Json | null
          linkedin_data?: Json | null
          location?: string | null
          phone?: never
          pillar_scores?: Json | null
          preferences?: Json | null
          preferred_roles?: Json | null
          resume_score?: number | null
          skills?: Json | null
          skills_vector?: Json | null
          updated_at?: string | null
          user_id?: string | null
          validation_score?: number | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      company_has_active_jobs: {
        Args: { _company_id: string }
        Returns: boolean
      }
      get_current_user_candidate_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_company_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_profiles: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["profile_type"][]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_contact_consent: {
        Args: { _candidate_id: string; _company_id: string }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      mask_cpf: {
        Args: { cpf: string }
        Returns: string
      }
      mask_email: {
        Args: { email: string }
        Returns: string
      }
      mask_name: {
        Args: { full_name: string }
        Returns: string
      }
      mask_phone: {
        Args: { phone: string }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      user_can_view_candidate_through_match: {
        Args: { candidate_profile_id: string }
        Returns: boolean
      }
      user_owns_candidate_profile: {
        Args: { profile_id: string }
        Returns: boolean
      }
      user_owns_company_profile: {
        Args: { profile_id: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      application_status:
        | "applied"
        | "viewed"
        | "rejected"
        | "accepted"
        | "interview_scheduled"
      job_status: "active" | "paused" | "closed"
      profile_type: "candidate" | "company"
      questionnaire_category:
        | "cultural"
        | "professional"
        | "technical"
        | "candidate"
        | "job"
      work_model: "remote" | "hybrid" | "onsite"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: [
        "applied",
        "viewed",
        "rejected",
        "accepted",
        "interview_scheduled",
      ],
      job_status: ["active", "paused", "closed"],
      profile_type: ["candidate", "company"],
      questionnaire_category: [
        "cultural",
        "professional",
        "technical",
        "candidate",
        "job",
      ],
      work_model: ["remote", "hybrid", "onsite"],
    },
  },
} as const
