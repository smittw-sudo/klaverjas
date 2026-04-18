export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Convenience type aliases (without index signatures — for use outside Database type)
export type TrumpSuit = 'harten' | 'schoppen' | 'klaveren' | 'ruiten'
export type KraakType = 'geen' | 'kraak' | 'rekraak' | 'superkraak'
export type GameVariant = 'amsterdams' | 'rotterdams' | 'kraken_amsterdams' | 'kraken_rotterdams'
export type GameStatus = 'active' | 'completed' | 'abandoned'
export type RoemType = 'stuk' | 'drie_op_rij' | 'vier_op_rij' | 'vijf_plus' | 'vier_boeren' | 'vier_tienen' | 'vier_azen' | 'pit'
export type TeamSide = 'spelend' | 'tegen'
export type SeatPosition = 1 | 2 | 3 | 4
export type KraakMultiplier = 1 | 2 | 4 | 8

// Inferred row types from the Database type
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionPlayer = Database['public']['Tables']['session_players']['Row']
export type Game = Database['public']['Tables']['games']['Row']
export type GamePlayer = Database['public']['Tables']['game_players']['Row']
export type Hand = Database['public']['Tables']['hands']['Row']
export type RoemEntry = Database['public']['Tables']['roem_entries']['Row']

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          created_at: string
        }
        Insert: {
          id: string
          username: string
          created_at?: string
        }
        Update: {
          username?: string
          created_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          user_id: string | null
          display_name: string
          is_guest: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          display_name: string
          is_guest?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string | null
          display_name?: string
          is_guest?: boolean
          created_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          created_by: string
          name: string
          description: string | null
          start_date: string
          end_date: string | null
          is_private: boolean
          created_at: string
        }
        Insert: {
          id?: string
          created_by: string
          name: string
          description?: string | null
          start_date: string
          end_date?: string | null
          is_private?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          is_private?: boolean
          created_at?: string
        }
        Relationships: []
      }
      session_players: {
        Row: {
          id: string
          session_id: string
          player_id: string
        }
        Insert: {
          id?: string
          session_id: string
          player_id: string
        }
        Update: {
          session_id?: string
          player_id?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          id: string
          created_by: string | null
          session_id: string | null
          name: string | null
          played_at: string
          variant: GameVariant
          status: GameStatus
          created_at: string
        }
        Insert: {
          id?: string
          created_by?: string | null
          session_id?: string | null
          name?: string | null
          played_at?: string
          variant: GameVariant
          status?: GameStatus
          created_at?: string
        }
        Update: {
          created_by?: string | null
          session_id?: string | null
          name?: string | null
          played_at?: string
          variant?: GameVariant
          status?: GameStatus
          created_at?: string
        }
        Relationships: []
      }
      game_players: {
        Row: {
          id: string
          game_id: string
          player_id: string
          seat_position: number
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          seat_position: number
        }
        Update: {
          game_id?: string
          player_id?: string
          seat_position?: number
        }
        Relationships: []
      }
      hands: {
        Row: {
          id: string
          game_id: string
          hand_number: number
          dealer_seat: number
          trump_maker_seat: number
          trump_suit: TrumpSuit
          kraak_type: KraakType
          kraak_multiplier: number
          spelend_team_kaartpunten: number
          spelend_team_seat: number
          spelend_team_roem: number
          tegen_team_roem: number
          spelend_team_roem_afgekeurd: boolean
          nat: boolean
          pit: boolean
          verzaakt: boolean
          verzaakt_seat: number | null
          team_a_eindpunten: number
          team_b_eindpunten: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          hand_number: number
          dealer_seat: number
          trump_maker_seat: number
          trump_suit: TrumpSuit
          kraak_type?: KraakType
          kraak_multiplier?: number
          spelend_team_kaartpunten: number
          spelend_team_seat: number
          spelend_team_roem?: number
          tegen_team_roem?: number
          spelend_team_roem_afgekeurd?: boolean
          nat?: boolean
          pit?: boolean
          verzaakt?: boolean
          verzaakt_seat?: number | null
          team_a_eindpunten: number
          team_b_eindpunten: number
          created_at?: string
        }
        Update: {
          hand_number?: number
          dealer_seat?: number
          trump_maker_seat?: number
          trump_suit?: TrumpSuit
          kraak_type?: KraakType
          kraak_multiplier?: number
          spelend_team_kaartpunten?: number
          spelend_team_seat?: number
          spelend_team_roem?: number
          tegen_team_roem?: number
          spelend_team_roem_afgekeurd?: boolean
          nat?: boolean
          pit?: boolean
          verzaakt?: boolean
          verzaakt_seat?: number | null
          team_a_eindpunten?: number
          team_b_eindpunten?: number
          created_at?: string
        }
        Relationships: []
      }
      roem_entries: {
        Row: {
          id: string
          hand_id: string
          team: TeamSide
          roem_type: RoemType
          punten: number
          afgekeurd: boolean
          created_at: string
        }
        Insert: {
          id?: string
          hand_id: string
          team: TeamSide
          roem_type: RoemType
          punten: number
          afgekeurd?: boolean
          created_at?: string
        }
        Update: {
          hand_id?: string
          team?: TeamSide
          roem_type?: RoemType
          punten?: number
          afgekeurd?: boolean
          created_at?: string
        }
        Relationships: []
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
