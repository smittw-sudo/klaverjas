import { createClient } from '@/lib/supabase/client'
import type { Player } from '@/lib/supabase/types'

export async function getPlayers(): Promise<Player[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('players').select('*').order('display_name')
  if (error) throw error
  return data
}

export async function createPlayer(display_name: string, is_guest = false): Promise<Player> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('players').insert({ display_name, is_guest }).select().single()
  if (error) throw error
  return data
}
