import { createClient } from '@/lib/supabase/server'
import type { Player } from '@/lib/supabase/types'

export async function getPlayers(): Promise<Player[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('display_name')
  if (error) throw error
  return data
}

export async function createPlayer(display_name: string): Promise<Player> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .insert({ display_name, is_guest: false })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createGuestPlayer(display_name: string): Promise<Player> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .insert({ display_name, is_guest: true })
    .select()
    .single()
  if (error) throw error
  return data
}
