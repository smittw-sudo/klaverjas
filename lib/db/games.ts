import { createClient } from '@/lib/supabase/client'
import type { Game, GamePlayer, Player } from '@/lib/supabase/types'

export async function getGame(id: string): Promise<Game | null> {
  const supabase = createClient()
  const { data } = await supabase.from('games').select('*').eq('id', id).single()
  return data ?? null
}

export async function getRecentGames(limit = 5): Promise<Game[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('games').select('*').neq('status', 'abandoned')
    .order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data
}

export async function getGamesBySession(sessionId: string): Promise<Game[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('games').select('*').eq('session_id', sessionId)
    .order('played_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createGame(input: {
  created_by: string
  session_id?: string | null
  name?: string | null
  played_at?: string
  variant: Game['variant']
}): Promise<Game> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('games').insert({ ...input, status: 'active' }).select().single()
  if (error) throw error
  return data
}

export async function deleteGame(id: string): Promise<void> {
  const supabase = createClient()
  const { data: hands } = await supabase.from('hands').select('id').eq('game_id', id)
  if (hands?.length) {
    await supabase.from('roem_entries').delete().in('hand_id', hands.map(h => h.id))
  }
  await supabase.from('hands').delete().eq('game_id', id)
  await supabase.from('game_players').delete().eq('game_id', id)
  const { error } = await supabase.from('games').delete().eq('id', id)
  if (error) throw error
}

export interface GameWithPlayers extends Game {
  teamA: string[]   // display names seats 1&3
  teamB: string[]   // display names seats 2&4
  handCount: number
  teamAScore: number
  teamBScore: number
}

export async function getAllGames(sessionId?: string): Promise<GameWithPlayers[]> {
  const supabase = createClient()

  let q = supabase.from('games').select('*').neq('status', 'abandoned')
  if (sessionId) q = q.eq('session_id', sessionId)
  else q = q.is('session_id', null)   // losse potjes op dashboard
  const { data: games, error } = await q.order('played_at', { ascending: false })
  if (error || !games?.length) return []

  const gameIds = games.map(g => g.id)
  const [{ data: gpRows }, { data: handRows }] = await Promise.all([
    supabase.from('game_players').select('game_id, seat_position, player:players(display_name)').in('game_id', gameIds),
    supabase.from('hands').select('game_id, team_a_eindpunten, team_b_eindpunten').in('game_id', gameIds),
  ])

  // Pre-index
  const gpByGame = new Map<string, typeof gpRows>()
  for (const gp of gpRows ?? []) {
    const list = gpByGame.get(gp.game_id) ?? []
    list.push(gp); gpByGame.set(gp.game_id, list)
  }
  const scoreByGame = new Map<string, { a: number; b: number; count: number }>()
  for (const h of handRows ?? []) {
    const s = scoreByGame.get(h.game_id) ?? { a: 0, b: 0, count: 0 }
    s.a += h.team_a_eindpunten; s.b += h.team_b_eindpunten; s.count++
    scoreByGame.set(h.game_id, s)
  }

  return games.map(g => {
    const gps = gpByGame.get(g.id) ?? []
    const teamA = gps.filter(p => p.seat_position === 1 || p.seat_position === 3).map(p => (p as any).player.display_name)
    const teamB = gps.filter(p => p.seat_position === 2 || p.seat_position === 4).map(p => (p as any).player.display_name)
    const score = scoreByGame.get(g.id) ?? { a: 0, b: 0, count: 0 }
    return { ...g, teamA, teamB, handCount: score.count, teamAScore: score.a, teamBScore: score.b }
  })
}

export async function getAllGamesBySession(): Promise<GameWithPlayers[]> {
  const supabase = createClient()
  const { data: games } = await supabase.from('games').select('*').neq('status', 'abandoned').order('played_at', { ascending: false })
  if (!games?.length) return []

  const gameIds = games.map(g => g.id)
  const [{ data: gpRows }, { data: handRows }] = await Promise.all([
    supabase.from('game_players').select('game_id, seat_position, player:players(display_name)').in('game_id', gameIds),
    supabase.from('hands').select('game_id, team_a_eindpunten, team_b_eindpunten').in('game_id', gameIds),
  ])

  const gpByGame = new Map<string, typeof gpRows>()
  for (const gp of gpRows ?? []) {
    const list = gpByGame.get(gp.game_id) ?? []
    list.push(gp); gpByGame.set(gp.game_id, list)
  }
  const scoreByGame = new Map<string, { a: number; b: number; count: number }>()
  for (const h of handRows ?? []) {
    const s = scoreByGame.get(h.game_id) ?? { a: 0, b: 0, count: 0 }
    s.a += h.team_a_eindpunten; s.b += h.team_b_eindpunten; s.count++
    scoreByGame.set(h.game_id, s)
  }

  return games.map(g => {
    const gps = gpByGame.get(g.id) ?? []
    const teamA = gps.filter(p => p.seat_position === 1 || p.seat_position === 3).map(p => (p as any).player.display_name)
    const teamB = gps.filter(p => p.seat_position === 2 || p.seat_position === 4).map(p => (p as any).player.display_name)
    const score = scoreByGame.get(g.id) ?? { a: 0, b: 0, count: 0 }
    return { ...g, teamA, teamB, handCount: score.count, teamAScore: score.a, teamBScore: score.b }
  })
}

export async function getActiveGame(): Promise<Game | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('games').select('*').eq('status', 'active')
    .order('created_at', { ascending: false }).limit(1).single()
  return data ?? null
}

export async function getGamePlayers(gameId: string): Promise<(GamePlayer & { player: Player })[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('game_players').select('*, player:players(*)').eq('game_id', gameId).order('seat_position')
  if (error) throw error
  return data as unknown as (GamePlayer & { player: Player })[]
}

export async function assignPlayers(
  gameId: string,
  assignments: Array<{ player_id: string; seat_position: 1 | 2 | 3 | 4 }>
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('game_players').insert(assignments.map(a => ({ game_id: gameId, ...a })))
  if (error) throw error
}
