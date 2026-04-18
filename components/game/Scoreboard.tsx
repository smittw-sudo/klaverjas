'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`game-${game.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hands', filter: `game_id=eq.${game.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setHands(prev => [...prev.filter(h => h.id !== (payload.new as Hand).id), payload.new as Hand].sort((a, b) => a.hand_number - b.hand_number))
          } else if (payload.eventType === 'UPDATE') {
            setHands(prev => prev.map(h => h.id === (payload.new as Hand).id ? payload.new as Hand : h))
          } else if (payload.eventType === 'DELETE') {
            setHands(prev => prev.filter(h => h.id !== (payload.old as Hand).id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [game.id])

  const teamATotal = hands.reduce((s, h) => s + h.team_a_eindpunten, 0)
  const teamBTotal = hands.reduce((s, h) => s + h.team_b_eindpunten, 0)

  const teamA = players.filter(p => p.seat_position === 1 || p.seat_position === 3)
  const teamB = players.filter(p => p.seat_position === 2 || p.seat_position === 4)

  const teamALabel = teamA.map(p => p.display_name).join(' & ')
  const teamBLabel = teamB.map(p => p.display_name).join(' & ')

  // Individual totals
  const isTeamA = (seat: number) => seat === 1 || seat === 3
  const individualTotals = players.map(p => {
    const total = hands.reduce((s, h) => {
      const score = isTeamA(p.seat_position) ? Math.round(h.team_a_eindpunten / 2) : Math.round(h.team_b_eindpunten / 2)
      return s + score
    }, 0)
    return { ...p, total }
  }).sort((a, b) => b.total - a.total)

  const nextHandNumber = hands.length + 1
  const isComplete = game.status === 'completed' || hands.length >= 16

  return (
    <div className="space-y-4">
      {/* Team scores */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        <div className={`bg-gray-900 rounded-xl p-4 border-2 ${teamATotal > teamBTotal ? 'border-blue-500' : 'border-gray-700'}`}>
          <p className="text-xs text-blue-400 font-medium truncate">{teamALabel}</p>
          <p className="text-3xl font-bold font-mono mt-1">{teamATotal}</p>
        </div>
        <div className={`bg-gray-900 rounded-xl p-4 border-2 ${teamBTotal > teamATotal ? 'border-orange-500' : 'border-gray-700'}`}>
          <p className="text-xs text-orange-400 font-medium truncate">{teamBLabel}</p>
          <p className="text-3xl font-bold font-mono mt-1">{teamBTotal}</p>
        </div>
      </div>

      {/* Add hand button */}
      {!isComplete && game.status === 'active' && (
        <div className="px-4">
          <Link
            href={`/games/${game.id}/hand/${nextHandNumber}/trump`}
            className="block w-full py-3 bg-green-700 hover:bg-green-600 text-white text-center font-semibold rounded-xl transition-colors"
          >
            + Handje {nextHandNumber} invoeren
          </Link>
        </div>
      )}

      {/* Hands list */}
      {hands.length > 0 ? (
        <div className="bg-gray-900 rounded-xl mx-4 overflow-hidden border border-gray-800">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800 text-xs text-gray-500 font-medium">
            <span className="w-5">#</span>
            <span>Troef</span>
            <span className="flex-1">Score</span>
            <span className="text-blue-400">A</span>
            <span className="text-gray-600">|</span>
            <span className="text-orange-400">B</span>
          </div>
          {hands.map(hand => (
            <HandRow
              key={hand.id}
              hand={hand}
              handNumber={hand.hand_number}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 text-sm py-4">Nog geen handjes gespeeld</p>
      )}

      {/* Individual totals */}
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

      {/* Game complete banner */}
      {isComplete && (
        <div className="mx-4 bg-green-900/50 border border-green-600 rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-green-300">Potje afgelopen!</p>
          <p className="text-sm text-green-400 mt-1">
            Winnaar: {teamATotal > teamBTotal ? teamALabel : teamBLabel}
          </p>
        </div>
      )}
    </div>
  )
}
