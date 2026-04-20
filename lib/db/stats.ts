import { createClient } from '@/lib/supabase/client'

export interface IndividualStats {
  playerId: string
  displayName: string
  // Totalen
  gamesCompleted: number   // alleen afgeronde potjes
  totalPoints: number
  troefMade: number
  troefNat: number
  pitsTotal: number        // pits als maker + maat
  // Per-potje gemiddelden
  avgPointsPerGame: number
  avgNatsPerGame: number   // gem. keer nat per potje als troef-maker
  avgPitsPerGame: number   // gem. pits per potje
  // Percentages
  natPct: number           // nat% als troef-maker
  // Extra
  favoriteTrump: string | null
}

export interface DuoStats {
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
  gamesCompleted: number   // afgeronde potjes samen gespeeld
  handsPlayed: number      // totaal handjes samen op hetzelfde team
  pointsTogether: number
  asSpelend: number
  winsAsSpelend: number
  natsAsSpelend: number
  pitsAsSpelend: number
  natPct: number
  winPct: number
  avgPoints: number        // gem. team-eindpunten per handje samen
}

async function loadGameData(sessionId?: string) {
  const supabase = createClient()

  // Alleen voltooide potjes
  let gamesQuery = supabase.from('games').select('id, status').eq('status', 'completed')
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
  const loaded = await loadGameData(sessionId)
  if (!loaded) return []
  const { games, gamePlayers, hands } = loaded

  // Spelers per game
  const gpByGame = new Map<string, typeof gamePlayers>()
  for (const gp of gamePlayers) {
    const list = gpByGame.get(gp.game_id) ?? []
    list.push(gp); gpByGame.set(gp.game_id, list)
  }

  // Handjes per game
  const handsByGame = new Map<string, typeof hands>()
  for (const h of hands) {
    const list = handsByGame.get(h.game_id) ?? []
    list.push(h); handsByGame.set(h.game_id, list)
  }

  interface AccStats {
    playerId: string
    displayName: string
    gamesCompleted: number
    totalPoints: number
    troefMade: number
    troefNat: number
    pitsTotal: number
    suitCount: Record<string, number>
  }

  const statsMap = new Map<string, AccStats>()

  for (const game of games) {
    const gameGPs = gpByGame.get(game.id) ?? []
    const gameHands = handsByGame.get(game.id) ?? []
    const isTeamA = (seat: number) => seat === 1 || seat === 3

    for (const gp of gameGPs) {
      const pid = gp.player_id
      if (playerId && pid !== playerId) continue
      if (!statsMap.has(pid)) {
        statsMap.set(pid, {
          playerId: pid,
          displayName: (gp as any).player.display_name,
          gamesCompleted: 0, totalPoints: 0, troefMade: 0, troefNat: 0, pitsTotal: 0, suitCount: {},
        })
      }
      const s = statsMap.get(pid)!
      s.gamesCompleted++

      for (const hand of gameHands) {
        const spelendIsTeamA = isTeamA(hand.spelend_team_seat)
        const playerPoints = isTeamA(gp.seat_position)
          ? Math.round(hand.team_a_eindpunten / 2)
          : Math.round(hand.team_b_eindpunten / 2)
        s.totalPoints += playerPoints

        const isTrumpMaker = gp.seat_position === hand.trump_maker_seat
        const isSpelend = spelendIsTeamA ? isTeamA(gp.seat_position) : !isTeamA(gp.seat_position)

        if (isTrumpMaker) {
          s.troefMade++
          if (hand.nat) s.troefNat++
          if (hand.pit) s.pitsTotal++
          s.suitCount[hand.trump_suit] = (s.suitCount[hand.trump_suit] ?? 0) + 1
        } else if (isSpelend && hand.pit) {
          s.pitsTotal++
        }
      }
    }
  }

  return Array.from(statsMap.values()).map(s => {
    const natPct = s.troefMade > 0 ? Math.round((s.troefNat / s.troefMade) * 100) : 0
    const favEntry = Object.entries(s.suitCount).sort((a, b) => b[1] - a[1])[0]
    return {
      playerId: s.playerId,
      displayName: s.displayName,
      gamesCompleted: s.gamesCompleted,
      totalPoints: s.totalPoints,
      troefMade: s.troefMade,
      troefNat: s.troefNat,
      pitsTotal: s.pitsTotal,
      avgPointsPerGame: s.gamesCompleted > 0 ? Math.round(s.totalPoints / s.gamesCompleted) : 0,
      avgNatsPerGame: s.gamesCompleted > 0 ? Math.round((s.troefNat / s.gamesCompleted) * 10) / 10 : 0,
      avgPitsPerGame: s.gamesCompleted > 0 ? Math.round((s.pitsTotal / s.gamesCompleted) * 10) / 10 : 0,
      natPct,
      favoriteTrump: favEntry?.[0] ?? null,
    }
  }).sort((a, b) => b.totalPoints - a.totalPoints)
}

export async function getDuoStats(sessionId?: string): Promise<DuoStats[]> {
  const loaded = await loadGameData(sessionId)
  if (!loaded) return []
  const { games, gamePlayers, hands } = loaded

  const isTeamA = (seat: number) => seat === 1 || seat === 3
  const duoKey = (a: string, b: string) => [a, b].sort().join('|')

  const playerNames = new Map<string, string>()
  for (const gp of gamePlayers) {
    playerNames.set(gp.player_id, (gp as any).player.display_name)
  }

  const gpByGame = new Map<string, typeof gamePlayers>()
  for (const gp of gamePlayers) {
    const list = gpByGame.get(gp.game_id) ?? []
    list.push(gp); gpByGame.set(gp.game_id, list)
  }

  // Track which games each duo played together (for gamesCompleted)
  const duoGames = new Map<string, Set<string>>()

  const duoMap = new Map<string, {
    playerAId: string; playerBId: string
    handsPlayed: number; pointsTogether: number
    asSpelend: number; winsAsSpelend: number; natsAsSpelend: number; pitsAsSpelend: number
  }>()

  for (const hand of hands) {
    const gameGPs = gpByGame.get(hand.game_id) ?? []
    const spelendIsTeamA = isTeamA(hand.spelend_team_seat)

    const teamAPlayers = gameGPs.filter(gp => isTeamA(gp.seat_position))
    const teamBPlayers = gameGPs.filter(gp => !isTeamA(gp.seat_position))

    const groups = [
      { players: teamAPlayers, isSpelend: spelendIsTeamA, points: hand.team_a_eindpunten },
      { players: teamBPlayers, isSpelend: !spelendIsTeamA, points: hand.team_b_eindpunten },
    ]

    for (const { players, isSpelend, points } of groups) {
      if (players.length < 2) continue
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const aId = players[i].player_id
          const bId = players[j].player_id
          const key = duoKey(aId, bId)

          if (!duoMap.has(key)) {
            const [sA, sB] = [aId, bId].sort()
            duoMap.set(key, { playerAId: sA, playerBId: sB, handsPlayed: 0, pointsTogether: 0, asSpelend: 0, winsAsSpelend: 0, natsAsSpelend: 0, pitsAsSpelend: 0 })
            duoGames.set(key, new Set())
          }
          const duo = duoMap.get(key)!
          duo.handsPlayed++
          duo.pointsTogether += points
          duoGames.get(key)!.add(hand.game_id)
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

  return Array.from(duoMap.values()).map(d => {
    const key = duoKey(d.playerAId, d.playerBId)
    const gamesCompleted = duoGames.get(key)?.size ?? 0
    return {
      playerAId: d.playerAId, playerBId: d.playerBId,
      playerAName: playerNames.get(d.playerAId) ?? d.playerAId,
      playerBName: playerNames.get(d.playerBId) ?? d.playerBId,
      gamesCompleted,
      handsPlayed: d.handsPlayed,
      pointsTogether: d.pointsTogether,
      asSpelend: d.asSpelend,
      winsAsSpelend: d.winsAsSpelend,
      natsAsSpelend: d.natsAsSpelend,
      pitsAsSpelend: d.pitsAsSpelend,
      natPct: d.asSpelend > 0 ? Math.round((d.natsAsSpelend / d.asSpelend) * 100) : 0,
      winPct: d.asSpelend > 0 ? Math.round((d.winsAsSpelend / d.asSpelend) * 100) : 0,
      avgPoints: d.handsPlayed > 0 ? Math.round(d.pointsTogether / d.handsPlayed) : 0,
    }
  }).sort((a, b) => b.avgPoints - a.avgPoints)
}

export async function getGroupStats(sessionId?: string) {
  const supabase = createClient()
  // Alleen voltooide potjes
  let gamesQuery = supabase.from('games').select('id, status').eq('status', 'completed')
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
    totalNat, totalPit,
    natPct: Math.round((totalNat / hands.length) * 100),
    pitPct: Math.round((totalPit / hands.length) * 100),
    avgNatsPerGame: Math.round((totalNat / games.length) * 10) / 10,
    avgPitsPerGame: Math.round((totalPit / games.length) * 10) / 10,
  }
}
