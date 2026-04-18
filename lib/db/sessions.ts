import { createClient } from '@/lib/supabase/server'
import type { Session, SessionPlayer, Player } from '@/lib/supabase/types'

export async function getSessions(): Promise<Session[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getSession(id: string): Promise<Session | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getActiveSession(): Promise<Session | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .is('end_date', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data ?? null
}

export async function createSession(input: {
  name: string
  description?: string
  start_date: string
  end_date?: string
  is_private?: boolean
  created_by: string
}): Promise<Session> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function closeSession(id: string, end_date: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('sessions')
    .update({ end_date })
    .eq('id', id)
  if (error) throw error
}

export async function getSessionPlayers(sessionId: string): Promise<(SessionPlayer & { player: Player })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('session_players')
    .select('*, player:players(*)')
    .eq('session_id', sessionId)
  if (error) throw error
  return data as unknown as (SessionPlayer & { player: Player })[]
}

export async function addSessionPlayer(sessionId: string, playerId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('session_players')
    .insert({ session_id: sessionId, player_id: playerId })
  if (error && !error.message.includes('unique')) throw error
}

export async function removeSessionPlayer(sessionId: string, playerId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('session_players')
    .delete()
    .eq('session_id', sessionId)
    .eq('player_id', playerId)
  if (error) throw error
}
