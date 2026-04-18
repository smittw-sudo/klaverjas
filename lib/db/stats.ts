import { createClient } from '@/lib/supabase/server'

export interface IndividualStats {
  playerId: string
  displayName: string
  totalPoints: number
  handsPlayed: number
  gamesPlayed: number
  gamesWon: number
  troefMade: number
  troefWon: number
  troefNat: number
  pitsAsTrumpMaker: number
  pitsAsMaat: number
  favoriteTrump: string | null
  natPct: number
  winPct: number
}

export async function getIndividualStats(playerId?: string, sessionId?: string): Promise<IndividualStats[]> {
  const supabase = await createClient()

  // Use RPC or raw query — here we use a composed approach
  let gamesQuery = supabase.from('games').select('id')
  if (sessionId) gamesQuery = gamesQuery.eq('session_id', sessionId)
  const { data: games } = await gamesQuery
  const gameIds = (games ?? []).map(g => g.id)

  if (gameIds.length === 0) return []

  const { data: gamePlayers } = await supabase
    .from('game_players')
    .select('*, player:players(id, display_name)')
    .in('game_id', gameIds)

  const { data: hands } = await supabase
    .from('hands')
    .select('*')
    .in('game_id', gameIds)

  if (!gamePlayers || !hands) return []

  // Build stats per player
  const statsMap = new Map<string, IndividualStats>()

  for (const gp of gamePlayers) {
    const pid = gp.player_id
    if (playerId && pid !== playerId) continue
    if (!statsMap.has(pid)) {
      statsMap.set(pid, {
        playerId: pid,
        displayName: (gp as unknown as { player: { display_name: string } }).player.display_name,
        totalPoints: 0,
        handsPlayed: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        troefMade: 0,
        troefWon: 0,
        troefNat: 0,
        pitsAsTrumpMaker: 0,
        pitsAsMaat: 0,
        favoriteTrump: null,
        natPct: 0,
        winPct: 0,
      })
    }
  }

  // Count games played and won per player
  const gamePlayersByGame = new Map<string, typeof gamePlayers>()
  for (const gp of gamePlayers) {
    const list = gamePlayersByGame.get(gp.game_id) ?? []
    list.push(gp)
    gamePlayersByGame.set(gp.game_id, list)
  }

  // Process each hand
  const trumpCount = new Map<string, Record<string, number>>() // playerId -> suit -> count

  for (const hand of hands) {
    const gameGPs = gamePlayersByGame.get(hand.game_id) ?? []
    const isTeamA = (seat: number) => seat === 1 || seat === 3
    const spelendIsTeamA = isTeamA(hand.spelend_team_seat)

    for (const gp of gameGPs) {
      const pid = gp.player_id
      const stats = statsMap.get(pid)
      if (!stats) continue

      stats.handsPlayed++

      // Individual points: half of team total
      const score = isTeamA(gp.seat_position)
        ? Math.round(hand.team_a_eindpunten / 2)
        : Math.round(hand.team_b_eindpunten / 2)
      stats.totalPoints += score

      const isTrumpMaker = gp.seat_position === hand.trump_maker_seat
      const isSpelend = gp.seat_position === hand.spelend_team_seat ||
        (spelendIsTeamA ? isTeamA(gp.seat_position) : !isTeamA(gp.seat_position))

      // Troef stats
      if (isTrumpMaker) {
        stats.troefMade++
        if (!hand.nat) stats.troefWon++
        else stats.troefNat++
        if (hand.pit) stats.pitsAsTrumpMaker++

        // Trump suit count
        const suitMap = trumpCount.get(pid) ?? {}
        suitMap[hand.trump_suit] = (suitMap[hand.trump_suit] ?? 0) + 1
        trumpCount.set(pid, suitMap)
      } else if (isSpelend && hand.pit) {
        stats.pitsAsMaat++
      }
    }
  }

  // Favorite trump suit
  for (const [pid, suitMap] of trumpCount.entries()) {
    const stats = statsMap.get(pid)
    if (!stats) continue
    const fav = Object.entries(suitMap).sort((a, b) => b[1] - a[1])[0]
    if (fav) stats.favoriteTrump = fav[0]
  }

  // Calculate percentages
  const result = Array.from(statsMap.values()).map(s => ({
    ...s,
    natPct: s.troefMade > 0 ? Math.round((s.troefNat / s.troefMade) * 100) : 0,
    winPct: s.troefMade > 0 ? Math.round((s.troefWon / s.troefMade) * 100) : 0,
  }))

  return result.sort((a, b) => b.totalPoints - a.totalPoints)
}

export interface DuoStats {
  playerA: string
  playerB: string
  nameA: string
  nameB: string
  gamesTogther: number
  avgPointsPerGame: number
  natPct: number
}

export async function getGroupStats(sessionId?: string) {
  const supabase = await createClient()

  let gamesQuery = supabase.from('games').select('id, status')
  if (sessionId) gamesQuery = gamesQuery.eq('session_id', sessionId)
  const { data: games } = await gamesQuery
  if (!games?.length) return null

  const gameIds = games.map(g => g.id)

  const { data: hands } = await supabase
    .from('hands')
    .select('*')
    .in('game_id', gameIds)

  if (!hands?.length) return null

  const highestTeamScore = Math.max(...hands.flatMap(h => [h.team_a_eindpunten, h.team_b_eindpunten]))
  const totalNat = hands.filter(h => h.nat).length
  const totalPit = hands.filter(h => h.pit).length

  return {
    totalHands: hands.length,
    totalGames: games.length,
    completedGames: games.filter(g => g.status === 'completed').length,
    highestTeamScore,
    totalNat,
    totalPit,
    natPct: Math.round((totalNat / hands.length) * 100),
    pitPct: Math.round((totalPit / hands.length) * 100),
  }
}
