// Generated from the Supabase schema (generate_typescript_types). Do not edit by hand.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      events: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          date_time: string
          description: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          gift_link_url: string | null
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          max_guests: number | null
          media_url: string | null
          primary_color: string | null
          reminder_offset_hours: number
          reminder_sent_at: string | null
          rsvp_deadline: string | null
          slug: string
          template_id: string
          title: string
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          date_time: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          gift_link_url?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          media_url?: string | null
          primary_color?: string | null
          reminder_offset_hours?: number
          reminder_sent_at?: string | null
          rsvp_deadline?: string | null
          slug: string
          template_id?: string
          title: string
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          date_time?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          gift_link_url?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          media_url?: string | null
          primary_color?: string | null
          reminder_offset_hours?: number
          reminder_sent_at?: string | null
          rsvp_deadline?: string | null
          slug?: string
          template_id?: string
          title?: string
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          email: string | null
          event_id: string
          full_name: string
          guest_count: number
          guest_names: Json
          id: string
          notes: string | null
          phone: string
          source: Database["public"]["Enums"]["registration_source"]
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          full_name: string
          guest_count?: number
          guest_names?: Json
          id?: string
          notes?: string | null
          phone: string
          source?: Database["public"]["Enums"]["registration_source"]
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          full_name?: string
          guest_count?: number
          guest_names?: Json
          id?: string
          notes?: string | null
          phone?: string
          source?: Database["public"]["Enums"]["registration_source"]
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          display_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_staff: {
        Args: { p_display_name?: string; p_email: string }
        Returns: string
      }
    }
    Enums: {
      event_type: "private" | "business"
      registration_source: "self" | "manual"
      registration_status: "confirmed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type EventRow = Database["public"]["Tables"]["events"]["Row"]
export type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"]
export type EventType = Database["public"]["Enums"]["event_type"]

export const Constants = {
  public: {
    Enums: {
      event_type: ["private", "business"],
      registration_source: ["self", "manual"],
      registration_status: ["confirmed", "cancelled"],
    },
  },
} as const
