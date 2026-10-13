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
      profiles: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      trips: {
        Row: {
          id: string
          user_id: string
          destination_name: string
          magnet_key: string
          start_date: string | null
          end_date: string | null
          target_budget_minor: number
          currency: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          destination_name: string
          magnet_key?: string
          start_date?: string | null
          end_date?: string | null
          target_budget_minor: number
          currency?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          destination_name?: string
          magnet_key?: string
          start_date?: string | null
          end_date?: string | null
          target_budget_minor?: number
          currency?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trips_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      savings_transactions: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          amount_minor: number
          currency: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          amount_minor: number
          currency?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          amount_minor?: number
          currency?: string
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'savings_transactions_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'savings_transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      itinerary_items: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          title: string
          activity_date: string | null
          trip_day: number | null
          activity_time: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          title: string
          activity_date?: string | null
          trip_day?: number | null
          activity_time?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          title?: string
          activity_date?: string | null
          trip_day?: number | null
          activity_time?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'itinerary_items_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'itinerary_items_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      checklist_items: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          title: string
          due_date: string | null
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          title: string
          due_date?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          title?: string
          due_date?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'checklist_items_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'checklist_items_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      countries: {
        Row: {
          id: string
          name: string
          country_code: string
          continent: string
          flag_emoji: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          country_code: string
          continent: string
          flag_emoji?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          country_code?: string
          continent?: string
          flag_emoji?: string | null
          created_at?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          id: string
          slug: string
          name: string
          country_id: string
          city: string | null
          region: string | null
          continent: string
          destination_type: string
          short_description: string | null
          landmark_names: string[]
          tags: string[]
          popularity_score: number
          is_featured: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          country_id: string
          city?: string | null
          region?: string | null
          continent: string
          destination_type: string
          short_description?: string | null
          landmark_names?: string[]
          tags?: string[]
          popularity_score?: number
          is_featured?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          country_id?: string
          city?: string | null
          region?: string | null
          continent?: string
          destination_type?: string
          short_description?: string | null
          landmark_names?: string[]
          tags?: string[]
          popularity_score?: number
          is_featured?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'destinations_country_id_fkey'
            columns: ['country_id']
            isOneToOne: false
            referencedRelation: 'countries'
            referencedColumns: ['id']
          }
        ]
      }
      magnet_assets: {
        Row: {
          id: string
          destination_id: string
          asset_url: string
          thumbnail_url: string | null
          asset_format: string
          background_type: string
          magnet_shape: string
          artwork_style: string
          dominant_colors: string[]
          generation_status: string
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          destination_id: string
          asset_url: string
          thumbnail_url?: string | null
          asset_format?: string
          background_type?: string
          magnet_shape?: string
          artwork_style?: string
          dominant_colors?: string[]
          generation_status?: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          destination_id?: string
          asset_url?: string
          thumbnail_url?: string | null
          asset_format?: string
          background_type?: string
          magnet_shape?: string
          artwork_style?: string
          dominant_colors?: string[]
          generation_status?: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'magnet_assets_destination_id_fkey'
            columns: ['destination_id']
            isOneToOne: false
            referencedRelation: 'destinations'
            referencedColumns: ['id']
          }
        ]
      }
      user_magnets: {
        Row: {
          id: string
          user_id: string
          destination_id: string
          magnet_asset_id: string
          trip_id: string | null
          acquired_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          destination_id: string
          magnet_asset_id: string
          trip_id?: string | null
          acquired_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          destination_id?: string
          magnet_asset_id?: string
          trip_id?: string | null
          acquired_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_magnets_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_magnets_destination_id_fkey'
            columns: ['destination_id']
            isOneToOne: false
            referencedRelation: 'destinations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_magnets_magnet_asset_id_fkey'
            columns: ['magnet_asset_id']
            isOneToOne: false
            referencedRelation: 'magnet_assets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_magnets_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
