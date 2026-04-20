import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import HandRow from './HandRow'
import type { Hand, Game } from '@/lib/supabase/types'

interface Player {
  id: string
  display_name: string
  seat_position: number
}

interface Props {
  game: Game
  initialHands: Hand[]
  players: Player[]
}

export default function Scoreboard({ game, initialHands, players }: Props) {
  const [hands, setHands] = useState<Hand[]>(initialHands)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`game-${game.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hands', filter: `game_id=eq.${game.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setHands(prev => [...prev.filter(h => h.id !== (payload.new as Hand).id), payload.new as Hand].sort((a, b) => a.hand_number - b.hand_number))
        } else if (payload.eventType === 'UPDATE') {
          setHands(prev => prev.map(h => h.id === (payload.new as Hand).id ? payload.new as Hand : h))
        } else if (payload.eventType === 'DELETE') {
          setHands(prev => prev.filter(h => h.id !== (payload.old as Hand).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [game.id])

  const teamATotal = hands.reduce((s, h) => s + h.team_a_eindpunten, 0)
  const teamBTotal = hands.reduce((s, h) => s + h.team_b_eindpunten, 0)
  const teamA = players.filter(p => p.seat_position === 1 || p.seat_position === 3)
  const teamB = players.filter(p => p.seat_position === 2 || p.seat_position === 4)
  const teamANames = teamA.map(p => p.display_name).join(' & ')
  const teamBNames = teamB.map(p => p.display_name).join(' & ')
  const isTeamA = (seat: number) => seat === 1 || seat === 3

  const individualTotals = players.map(p => ({
    ...p,
    total: hands.reduce((s, h) => s + (isTeamA(p.seat_position) ? Math.round(h.team_a_eindpunten / 2) : Math.round(h.team_b_eindpunten / 2)), 0),
  })).sort((a, b) => b.total - a.total)

  const nextHandNumber = hands.length + 1
  const isComplete = game.status === 'completed' || hands.length >= 16

  // Bereken per hand de kaartpunten en roem per team
  const handData = hands.map(h => {
    const spelendIsTeamA = isTeamA(h.spelend_team_seat)
    const teamAKaart = spelendIsTeamA ? h.spelend_team_kaartpunten : (162 - h.spelend_team_kaartpunten)
    const teamBKaart = 162 - teamAKaart
    const teamARoem = spelendIsTeamA ? h.spelend_team_roem : h.tegen_team_roem
    const teamBRoem = spelendIsTeamA ? h.tegen_team_roem : h.spelend_team_roem
    return { hand: h, spelendIsTeamA, teamAKaart, teamBKaart, teamARoem, teamBRoem }
  })

  // Lopende cumulatieve totalen
  let cumA = 0, cumB = 0
  const handDataWithCum = handData.map(d => {
    cumA += d.hand.team_a_eindpunten
    cumB += d.hand.team_b_eindpunten
    return { ...d, cumTeamA: cumA, cumTeamB: cumB }
  })

  // Groepeer in blokken van 4
  const blocks: typeof handDataWithCum[] = []
  for (let i = 0; i < handDataWithCum.length; i += 4) {
    blocks.push(handDataWithCum.slice(i, i + 4))
  }

  const teamAShort = 'Wij'
  const teamBShort = 'Zij'

  return (
    <div className="space-y-4">
      {/* Totaalstand */}
      {(() => {
        const diff = Math.abs(teamATotal - teamBTotal)
        const aLeads = teamATotal > teamBTotal
        const bLeads = teamBTotal > teamATotal
        return (
          <div className="px-4 pt-4">
            <div className="flex items-stretch gap-2">
              {/* Wij */}
              <div className={`flex-1 rounded-2xl p-4 border-2 transition-all ${
                aLeads
                  ? 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-900/30'
                  : 'bg-gray-900 border-gray-700'
              }`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${aLeads ? 'text-blue-400' : 'text-gray-500'}`}>Wij</p>
                <p className={`font-bold font-mono leading-none mt-1 ${aLeads ? 'text-4xl text-white' : 'text-3xl text-gray-300'}`}>
                  {teamATotal}
                </p>
                <p className="text-[10px] text-gray-500 mt-1 truncate">{teamANames}</p>
              </div>

              {/* Midden: verschil of gelijkstand */}
              <div className="flex flex-col items-center justify-center gap-1 shrink-0 w-12">
                {hands.length > 0 && diff > 0 ? (
                  <>
                    <span className={`text-xs font-bold ${aLeads ? 'text-blue-400' : 'text-orange-400'}`}>
                      {aLeads ? '▲' : '▼'}
                    </span>
                    <span className="text-sm font-bold font-mono text-white">{diff}</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-600">vs</span>
                )}
              </div>

              {/* Zij */}
              <div className={`flex-1 rounded-2xl p-4 border-2 transition-all ${
                bLeads
                  ? 'bg-orange-950/80 border-orange-500 shadow-lg shadow-orange-900/30'
                  : 'bg-gray-900 border-gray-700'
              }`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${bLeads ? 'text-orange-400' : 'text-gray-500'}`}>Zij</p>
                <p className={`font-bold font-mono leading-none mt-1 ${bLeads ? 'text-4xl text-white' : 'text-3xl text-gray-300'}`}>
                  {teamBTotal}
                </p>
                <p className="text-[10px] text-gray-500 mt-1 truncate">{teamBNames}</p>
              </div>
            </div>
          </div>
        )
      })()}

      {!isComplete && game.status === 'active' && (
        <div className="px-4">
          <Link
            to={`/games/${game.id}/hand/${nextHandNumber}/trump`}
            className="block w-full py-3 bg-green-700 hover:bg-green-600 text-white text-center font-semibold rounded-xl transition-colors"
          >
            + Handje {nextHandNumber} invoeren
          </Link>
        </div>
      )}

      {/* Handjes per blok van 4 */}
      {hands.length > 0 && (
        <div className="mx-4 space-y-3">
          {/* Kolomhoofden */}
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-gray-500 font-medium">
            <span className="w-4 shrink-0">#</span>
            <span className="text-xl opacity-0 shrink-0">·</span>
            <span className="flex-1 text-center">
              <span className="text-blue-400">{teamAShort}</span>
              <span className="text-gray-600"> / </span>
              <span className="text-orange-400">{teamBShort}</span>
              <span className="text-gray-600 ml-1">krt</span>
            </span>
            <span className="text-blue-400 shrink-0 w-8 text-right">Wij</span>
            <span className="text-gray-600 shrink-0">|</span>
            <span className="text-orange-400 shrink-0 w-8">Zij</span>
          </div>

          {blocks.map((block, bi) => {
            const prevCumA = bi > 0 ? blocks[bi - 1][blocks[bi - 1].length - 1].cumTeamA : 0
            const prevCumB = bi > 0 ? blocks[bi - 1][blocks[bi - 1].length - 1].cumTeamB : 0
            const last = block[block.length - 1]
            const blockSumA = last.cumTeamA - prevCumA
            const blockSumB = last.cumTeamB - prevCumB

            return (
              <div key={bi} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
                <div className="text-xs text-gray-600 px-3 pt-2 pb-0.5 font-medium">
                  Handjes {bi * 4 + 1}–{bi * 4 + block.length}
                </div>
                {block.map(d => (
                  <HandRow
                    key={d.hand.id}
                    hand={d.hand}
                    isTeamASpelend={d.spelendIsTeamA}
                    teamAKaart={d.teamAKaart}
                    teamBKaart={d.teamBKaart}
                    teamARoem={d.teamARoem}
                    teamBRoem={d.teamBRoem}
                    cumTeamA={d.cumTeamA}
                    cumTeamB={d.cumTeamB}
                  />
                ))}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 border-t border-gray-700">
                  <span className="text-xs text-gray-500 flex-1">Blok {bi + 1} subtotaal</span>
                  <span className={`font-mono text-sm font-bold ${blockSumA > blockSumB ? 'text-blue-300' : 'text-blue-600'}`}>{blockSumA}</span>
                  <span className="text-gray-600 text-xs">|</span>
                  <span className={`font-mono text-sm font-bold ${blockSumB > blockSumA ? 'text-orange-300' : 'text-orange-600'}`}>{blockSumB}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {hands.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-4">Nog geen handjes gespeeld</p>
      )}

      {/* Individueel */}
      {hands.length > 0 && (
        <div className="px-4">
          <p className="text-xs text-gray-500 mb-2">Individueel</p>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {individualTotals.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0 border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm w-4">{i + 1}</span>
                  <span className="font-medium text-sm">{p.display_name}</span>
                  <span className="text-xs text-gray-600">S{p.seat_position}</span>
                </div>
                <span className="font-mono font-semibold">{p.total} pt</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isComplete && (
        <div className="mx-4 bg-green-900/50 border border-green-600 rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-green-300">Potje afgelopen!</p>
          <p className="text-sm text-green-400 mt-1">
            Winnaar: {teamATotal > teamBTotal ? `Wij (${teamANames})` : `Zij (${teamBNames})`}
          </p>
        </div>
      )}
    </div>
  )
}
