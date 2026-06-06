/** Build Trigger: Schema Restoration & RLS Implementation - 2026-04-12 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          tag: string | null;
          display_name: string | null;
          role: string | null;
          college_name: string | null;
          company_name: string | null;
          startup_name: string | null;
          bio: string | null;
          linkedin_handle: string | null;
          github_handle: string | null;
          github_id: string | null;
          github_access_token: string | null;
          resume_link: string | null;
          portfolio_url: string | null;
          years_of_experience: string | null;
          tech_stacks: string[] | null;
          location: string | null;
          availability: string | null;
          website: string | null;
          xp: number;
          pr_count: number;
          is_admin: boolean;
          admin_sections: string[] | null;
          admin_pin_hash: string | null;
          admin_pin_reset_token: string | null;
          admin_pin_reset_expires: string | null;
          is_banned: boolean;
          ban_reason: string | null;
          xp_adjustment_reason: string | null;
          interview_status: string | null;
          interview_scheduled_at: string | null;
          created_at: string;
          updated_at: string;
          avatar_url: string | null;
          phone_number: string | null;
          phone_verified: boolean;
          phone_verified_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at" | "xp" | "pr_count" | "is_admin" | "is_banned" | "phone_verified"> & {
          xp?: number;
          pr_count?: number;
          is_admin?: boolean;
          is_banned?: boolean;
          phone_verified?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      phone_otps: {
        Row: {
          user_id: string;
          phone_number: string;
          code_hash: string;
          expires_at: string;
          attempts: number;
          last_sent_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["phone_otps"]["Row"], "attempts" | "last_sent_at" | "created_at"> & {
          attempts?: number;
          last_sent_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["phone_otps"]["Insert"]>;
      };
      admin_approval_queue: {
        Row: {
          id: string;
          requested_by: string;
          category: string;
          action_type: string;
          payload: Json;
          status: "PENDING" | "APPROVED" | "REJECTED";
          rejection_reason: string | null;
          created_at: string;
          processed_at: string | null;
          processed_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["admin_approval_queue"]["Row"], "id" | "created_at" | "status" | "processed_at" | "processed_by"> & {
          status?: "PENDING" | "APPROVED" | "REJECTED";
        };
        Update: Partial<Database["public"]["Tables"]["admin_approval_queue"]["Row"]>;
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          role_id: string;
          role_title: string;
          display_name: string;
          email: string;
          linkedin_handle: string | null;
          github_handle: string | null;
          resume_link: string | null;
          portfolio_url: string | null;
          answers: Json | null;
          status: "PENDING" | "ACCEPTED" | "REJECTED" | "UNDER_REVIEW";
          internal_notes: string | null;
          interview_scheduled_at: string | null;
          interview_status: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          under_review: boolean;
          submitted_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["applications"]["Row"], "id" | "submitted_at" | "updated_at" | "status" | "internal_notes" | "interview_scheduled_at" | "interview_status" | "reviewed_by" | "reviewed_at" | "under_review"> & {
          status?: "PENDING" | "ACCEPTED" | "REJECTED" | "UNDER_REVIEW";
        };
        Update: Partial<Omit<Database["public"]["Tables"]["applications"]["Row"], "id" | "submitted_at">>;
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string;
          admin_email: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["admin_audit_log"]["Row"], "id" | "created_at">;
        Update: never;
      };
      xp_log: {
        Row: {
          id: string;
          user_id: string;
          delta: number;
          reason: string;
          granted_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["xp_log"]["Row"], "id" | "created_at">;
        Update: never;
      };
      application_question_sets: {
        Row: {
          id: string;
          tier: string;
          role_title: string | null;
          questions: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["application_question_sets"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["application_question_sets"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          tier: "BEGINNER" | "INTERMEDIATE" | "FINAL_BOSS" | "GOD_MODE" | "SPONSORED";
          tier_level: string;
          status: "OPEN" | "RECRUITING" | "IN_PROGRESS" | "CLOSED";
          title: string;
          tagline: string;
          description: string;
          tech_stack: Json;
          timeline: Json;
          roles: Json;
          team_size: number;
          open_slots: number;
          tags: string[];
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      contacts: {
        Row: {
          id: string;
          company_name: string | null;
          email: string;
          subject: string | null;
          message: string;
          status: "NEW" | "IN_PROGRESS" | "RESOLVED";
          internal_notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["contacts"]["Row"], "id" | "created_at" | "status"> & {
          id?: string;
          created_at?: string;
          status?: "NEW" | "IN_PROGRESS" | "RESOLVED";
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
      };
      updates: {
        Row: {
          id: string;
          title: string;
          type: "NEWS" | "CHANGELOG" | "UPDATE";
          content: string;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["updates"]["Row"], "id" | "created_at" | "updated_at" | "is_published"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          is_published?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["updates"]["Insert"]>;
      };
      user_contributions: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          link: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_contributions"]["Row"], "id" | "created_at" | "status"> & {
          id?: string;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_contributions"]["Insert"]>;
      };
      career_listings: {
        Row: {
          id: string;
          title: string;
          tagline: string;
          description: string;
          department: string;
          status: string;
          roles: Json;
          tags: string[];
          location_type: string;
          commitment: string;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["career_listings"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["career_listings"]["Insert"]>;
      };
      career_applications: {
        Row: {
          id: string;
          user_id: string | null;
          listing_id: string | null;
          role_title: string;
          display_name: string;
          email: string;
          status: string;
          internal_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          submitted_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["career_applications"]["Row"], "id" | "submitted_at" | "updated_at"> & {
          id?: string;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["career_applications"]["Row"]>;
      };
      project_ideas: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          tagline: string;
          description: string;
          technical_details: string | null;
          target_audience: string | null;
          tech_stack: string[];
          team_help: boolean;
          product_help: boolean;
          advice_help: boolean;
          traction_help: boolean;
          status: "PENDING" | "APPROVED" | "REJECTED";
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_ideas"]["Row"], "id" | "status" | "created_at" | "updated_at" | "admin_notes"> & {
          status?: "PENDING" | "APPROVED" | "REJECTED";
        };
        Update: Partial<Database["public"]["Tables"]["project_ideas"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
