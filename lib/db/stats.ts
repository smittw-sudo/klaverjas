import { createClient } from '@/lib/supabase/client'

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

export interface DuoStats {
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
  handsPlayed: number        // samen op hetzelfde team
  pointsTogether: number     // totaal team-eindpunten als ze samen spelen
  asSpelend: number          // keer hun team troef maakt
  winsAsSpelend: number
  natsAsSpelend: number
  pitsAsSpelend: number
  natPct: number             // nat% als spelend duo
  winPct: number
  avgPoints: number          // gemiddeld per hand samen
}

async function loadGameData(sessionId?: string, playerId?: string) {
  const supabase = createClient()
  let gamesQuery = supabase.from('games').select('id, status')
  if (sessionId) gamesQuery = gamesQuery.eq('session_id', sessionId)
  const { data: games } = await gamesQuery
  const gameIds = (games ?? []).map(g => g.id)
  if (gameIds.length === 0) return null

  const [{ data: gamePlayers }, { data: hands }] = await Promise.all([
    supabase.from('game_players').select('*, player:players(id, display_name)').in('game_id', gameIds),
    supabase.from('hands').select('*').in('game_id', gameIds),
  ])
  if (!gamePlayers || !hands) return null

  return { games: games!, gameIds, gamePlayers, hands }
}

export async function getIndividualStats(playerId?: string, sessionId?: string): Promise<IndividualStats[]> {
  const loaded = await loadGameData(sessionId, playerId)
  if (!loaded) return []
  const { gamePlayers, hands } = loaded

  const statsMap = new Map<string, IndividualStats>()
  for (const gp of gamePlayers) {
    const pid = gp.player_id
    if (playerId && pid !== playerId) continue
    if (!statsMap.has(pid)) {
      statsMap.set(pid, {
        playerId: pid,
        displayName: (gp as any).player.display_name,
        totalPoints: 0, handsPlayed: 0, gamesPlayed: 0, gamesWon: 0,
        troefMade: 0, troefWon: 0, troefNat: 0,
        pitsAsTrumpMaker: 0, pitsAsMaat: 0, favoriteTrump: null, natPct: 0, winPct: 0,
      })
    }
  }

  const gamePlayersByGame = new Map<string, typeof gamePlayers>()
  for (const gp of gamePlayers) {
    const list = gamePlayersByGame.get(gp.game_id) ?? []
    list.push(gp); gamePlayersByGame.set(gp.game_id, list)
  }

  const trumpCount = new Map<string, Record<string, number>>()
  const isTeamA = (seat: number) => seat === 1 || seat === 3

  for (const hand of hands) {
    const gameGPs = gamePlayersByGame.get(hand.game_id) ?? []
    const spelendIsTeamA = isTeamA(hand.spelend_team_seat)
    for (const gp of gameGPs) {
      const pid = gp.player_id
      const stats = statsMap.get(pid)
      if (!stats) continue
      stats.handsPlayed++
      const score = isTeamA(gp.seat_position)
        ? Math.round(hand.team_a_eindpunten / 2)
        : Math.round(hand.team_b_eindpunten / 2)
      stats.totalPoints += score
      const isTrumpMaker = gp.seat_position === hand.trump_maker_seat
      const isSpelend = spelendIsTeamA ? isTeamA(gp.seat_position) : !isTeamA(gp.seat_position)
      if (isTrumpMaker) {
        stats.troefMade++
        if (!hand.nat) stats.troefWon++; else stats.troefNat++
        if (hand.pit) stats.pitsAsTrumpMaker++
        const suitMap = trumpCount.get(pid) ?? {}
        suitMap[hand.trump_suit] = (suitMap[hand.trump_suit] ?? 0) + 1
        trumpCount.set(pid, suitMap)
      } else if (isSpelend && hand.pit) {
        stats.pitsAsMaat++
      }
    }
  }

  for (const [pid, suitMap] of trumpCount.entries()) {
    const stats = statsMap.get(pid)
    if (!stats) continue
    const fav = Object.entries(suitMap).sort((a, b) => b[1] - a[1])[0]
    if (fav) stats.favoriteTrump = fav[0]
  }

  return Array.from(statsMap.values()).map(s => ({
    ...s,
    natPct: s.troefMade > 0 ? Math.round((s.troefNat / s.troefMade) * 100) : 0,
    winPct: s.troefMade > 0 ? Math.round((s.troefWon / s.troefMade) * 100) : 0,
  })).sort((a, b) => b.totalPoints - a.totalPoints)
}

export async function getDuoStats(sessionId?: string): Promise<DuoStats[]> {
  const loaded = await loadGameData(sessionId)
  if (!loaded) return []
  const { gamePlayers, hands } = loaded

  const isTeamA = (seat: number) => seat === 1 || seat === 3
  const duoKey = (a: string, b: string) => [a, b].sort().join('|')

  // Build player name lookup
  const playerNames = new Map<string, string>()
  for (const gp of gamePlayers) {
    playerNames.set(gp.player_id, (gp as any).player.display_name)
  }

  // Group game_players by game
  const gpByGame = new Map<string, typeof gamePlayers>()
  for (const gp of gamePlayers) {
    const list = gpByGame.get(gp.game_id) ?? []
    list.push(gp); gpByGame.set(gp.game_id, list)
  }

  const duoMap = new Map<string, {
    playerAId: string; playerBId: string
    handsPlayed: number; pointsTogether: number
    asSpelend: number; winsAsSpelend: number; natsAsSpelend: number; pitsAsSpelend: number
  }>()

  for (const hand of hands) {
    const gameGPs = gpByGame.get(hand.game_id) ?? []
    const spelendIsTeamA = isTeamA(hand.spelend_team_seat)

    // Groepeer spelers per team voor dit handje
    const teamAPlayers = gameGPs.filter(gp => isTeamA(gp.seat_position))
    const teamBPlayers = gameGPs.filter(gp => !isTeamA(gp.seat_position))

    const teamGroups = [
      { players: teamAPlayers, isSpelend: spelendIsTeamA, points: hand.team_a_eindpunten },
      { players: teamBPlayers, isSpelend: !spelendIsTeamA, points: hand.team_b_eindpunten },
    ]

    for (const { players, isSpelend, points } of teamGroups) {
      if (players.length < 2) continue
      // Genereer alle paren binnen dit team (normaal maar 1 paar van 2)
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const aId = players[i].player_id
          const bId = players[j].player_id
          const key = duoKey(aId, bId)

          if (!duoMap.has(key)) {
            const [sortedA, sortedB] = [aId, bId].sort()
            duoMap.set(key, {
              playerAId: sortedA, playerBId: sortedB,
              handsPlayed: 0, pointsTogether: 0,
              asSpelend: 0, winsAsSpelend: 0, natsAsSpelend: 0, pitsAsSpelend: 0,
            })
          }
          const duo = duoMap.get(key)!
          duo.handsPlayed++
          duo.pointsTogether += points
          if (isSpelend) {
            duo.asSpelend++
            if (hand.nat) duo.natsAsSpelend++
            else duo.winsAsSpelend++
            if (hand.pit) duo.pitsAsSpelend++
          }
        }
      }
    }
  }

  return Array.from(duoMap.values()).map(d => ({
    playerAId: d.playerAId,
    playerBId: d.playerBId,
    playerAName: playerNames.get(d.playerAId) ?? d.playerAId,
    playerBName: playerNames.get(d.playerBId) ?? d.playerBId,
    handsPlayed: d.handsPlayed,
    pointsTogether: d.pointsTogether,
    asSpelend: d.asSpelend,
    winsAsSpelend: d.winsAsSpelend,
    natsAsSpelend: d.natsAsSpelend,
    pitsAsSpelend: d.pitsAsSpelend,
    natPct: d.asSpelend > 0 ? Math.round((d.natsAsSpelend / d.asSpelend) * 100) : 0,
    winPct: d.asSpelend > 0 ? Math.round((d.winsAsSpelend / d.asSpelend) * 100) : 0,
    avgPoints: d.handsPlayed > 0 ? Math.round(d.pointsTogether / d.handsPlayed) : 0,
  })).sort((a, b) => b.pointsTogether - a.pointsTogether)
}

export async function getGroupStats(sessionId?: string) {
  const supabase = createClient()
  let gamesQuery = supabase.from('games').select('id, status')
  if (sessionId) gamesQuery = gamesQuery.eq('session_id', sessionId)
  const { data: games } = await gamesQuery
  if (!games?.length) return null
  const { data: hands } = await supabase.from('hands').select('*').in('game_id', games.map(g => g.id))
  if (!hands?.length) return null
  const totalNat = hands.filter(h => h.nat).length
  const totalPit = hands.filter(h => h.pit).length
  return {
    totalHands: hands.length,
    totalGames: games.length,
    completedGames: games.filter(g => g.status === 'completed').length,
    totalNat, totalPit,
    natPct: Math.round((totalNat / hands.length) * 100),
    pitPct: Math.round((totalPit / hands.length) * 100),
  }
}
