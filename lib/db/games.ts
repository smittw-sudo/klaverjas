import { createClient } from '@/lib/supabase/server'
import type { Game, GamePlayer, Player } from '@/lib/supabase/types'

export async function getGame(id: string): Promise<Game | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single()
  return data ?? null
}

export async function getRecentGames(limit = 5): Promise<Game[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .neq('status', 'abandoned')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getGamesBySession(sessionId: string): Promise<Game[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('session_id', sessionId)
    .order('played_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createGame(input: {
  created_by: string
  session_id?: string
  name?: string
  played_at?: string
  variant: Game['variant']
}): Promise<Game> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('games')
    .insert({ ...input, status: 'active' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGame(id: string): Promise<void> {
  const supabase = await createClient()
  // Delete child records first (in case FK cascade is not set)
  await supabase.from('roem_entries').delete().in(
    'hand_id',
    (await supabase.from('hands').select('id').eq('game_id', id)).data?.map(h => h.id) ?? []
  )
  await supabase.from('hands').delete().eq('game_id', id)
  await supabase.from('game_players').delete().eq('game_id', id)
  const { error } = await supabase.from('games').delete().eq('id', id)
  if (error) throw error
}

export async function completeGame(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('games')
    .update({ status: 'completed' })
    .eq('id', id)
  if (error) throw error
}

export async function getActiveGame(): Promise<Game | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data ?? null
}

export async function getGamePlayers(gameId: string): Promise<(GamePlayer & { player: Player })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('game_players')
    .select('*, player:players(*)')
    .eq('game_id', gameId)
    .order('seat_position')
  if (error) throw error
  return data as unknown as (GamePlayer & { player: Player })[]
}

export async function assignPlayers(
  gameId: string,
  assignments: Array<{ player_id: string; seat_position: 1 | 2 | 3 | 4 }>
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('game_players')
    .insert(assignments.map(a => ({ game_id: gameId, ...a })))
  if (error) throw error
}
