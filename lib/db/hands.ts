import { createClient } from '@/lib/supabase/server'
import type { Hand, RoemEntry, SeatPosition, Database } from '@/lib/supabase/types'

export async function getHands(gameId: string): Promise<Hand[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hands')
    .select('*')
    .eq('game_id', gameId)
    .order('hand_number')
  if (error) throw error
  return data
}

export async function getHand(id: string): Promise<Hand | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('hands')
    .select('*')
    .eq('id', id)
    .single()
  return data ?? null
}

export async function saveHand(input: Omit<Hand, 'id' | 'created_at'>): Promise<Hand> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hands')
    .upsert(input, { onConflict: 'game_id,hand_number' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateHand(id: string, updates: Database['public']['Tables']['hands']['Update']): Promise<Hand> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hands')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHand(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('hands')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function saveRoemEntries(
  handId: string,
  entries: Array<{ team: 'spelend' | 'tegen'; roem_type: RoemEntry['roem_type']; punten: number; afgekeurd?: boolean }>
): Promise<void> {
  const supabase = await createClient()
  // Delete existing entries for this hand first
  await supabase.from('roem_entries').delete().eq('hand_id', handId)
  if (entries.length === 0) return
  const { error } = await supabase
    .from('roem_entries')
    .insert(entries.map(e => ({ hand_id: handId, ...e, afgekeurd: e.afgekeurd ?? false })))
  if (error) throw error
}

export async function getRoemEntries(handId: string): Promise<RoemEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('roem_entries')
    .select('*')
    .eq('hand_id', handId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function getGameTotals(gameId: string): Promise<{ teamA: number; teamB: number }> {
  const hands = await getHands(gameId)
  return hands.reduce(
    (acc, h) => ({
      teamA: acc.teamA + h.team_a_eindpunten,
      teamB: acc.teamB + h.team_b_eindpunten,
    }),
    { teamA: 0, teamB: 0 }
  )
}

export async function getIndividualTotals(
  gameId: string,
  seatToPlayerId: Record<SeatPosition, string>
): Promise<Record<string, number>> {
  const hands = await getHands(gameId)
  const totals: Record<string, number> = {}

  for (const hand of hands) {
    const isTeamA = (seat: number) => seat === 1 || seat === 3
    const spelendIsTeamA = isTeamA(hand.spelend_team_seat)

    const teamAScore = hand.team_a_eindpunten
    const teamBScore = hand.team_b_eindpunten

    for (const [seatStr, playerId] of Object.entries(seatToPlayerId)) {
      const seat = Number(seatStr)
      const score = isTeamA(seat) ? Math.round(teamAScore / 2) : Math.round(teamBScore / 2)
      totals[playerId] = (totals[playerId] ?? 0) + score
    }
  }

  return totals
}
