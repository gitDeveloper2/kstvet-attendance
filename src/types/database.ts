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
          name: string
          role: 'trainer' | 'trainee'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'trainer' | 'trainee'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'trainer' | 'trainee'
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          latitude: number
          longitude: number
          radius: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          latitude: number
          longitude: number
          radius: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          latitude?: number
          longitude?: number
          radius?: number
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          code: string
          name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          is_active?: boolean
          created_at?: string
        }
      }
      venues: {
        Row: {
          id: string
          name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean
          created_at?: string
        }
      }
      trainer_units: {
        Row: {
          trainer_id: string
          unit_id: string
          created_at: string
        }
        Insert: {
          trainer_id: string
          unit_id: string
          created_at?: string
        }
        Update: {
          trainer_id?: string
          unit_id?: string
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          qr_token: string
          location_id: string | null
          location_name: string | null
          unit_id: string | null
          venue_id: string | null
          lesson_number: number | null
          trainer_id: string
          date: string
          start_time: string
          end_time: string
          title: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          qr_token: string
          location_id?: string | null
          location_name?: string | null
          unit_id?: string | null
          venue_id?: string | null
          lesson_number?: number | null
          trainer_id: string
          date: string
          start_time: string
          end_time: string
          title: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          qr_token?: string
          location_id?: string | null
          location_name?: string | null
          unit_id?: string | null
          venue_id?: string | null
          lesson_number?: number | null
          trainer_id?: string
          date?: string
          start_time?: string
          end_time?: string
          title?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          user_id: string
          session_id: string
          timestamp: string
          latitude: number
          longitude: number
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          timestamp?: string
          latitude: number
          longitude: number
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          timestamp?: string
          latitude?: number
          longitude?: number
          verified?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: {
          lat1: number
          lon1: number
          lat2: number
          lon2: number
        }
        Returns: number
      }
      is_within_location_radius: {
        Args: {
          user_lat: number
          user_lon: number
          location_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
