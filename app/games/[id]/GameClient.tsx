'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import Scoreboard from '@/components/game/Scoreboard'
import BottomNav from '@/components/ui/BottomNav'
import type { Game, Hand } from '@/lib/supabase/types'

interface Player {
  id: string
  display_name: string
  seat_position: number
}

export default function GameClient({ id }: { id: string }) {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [hands, setHands] = useState<Hand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [gameRes, gpRes, handsRes] = await Promise.all([
        supabase.from('games').select('*').eq('id', id).single(),
        supabase.from('game_players').select('*, player:players(*)').eq('game_id', id).order('seat_position'),
        supabase.from('hands').select('*').eq('game_id', id).order('hand_number'),
      ])

      if (!gameRes.data) { setLoading(false); return }

      setGame(gameRes.data)
      setPlayers(
        (gpRes.data ?? []).map((gp: any) => ({
          id: gp.player_id,
          display_name: gp.player.display_name,
          seat_position: gp.seat_position,
        }))
      )
      setHands(handsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Laden…</div>
  )

  if (!game) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Potje niet gevonden.</div>
  )

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title={game.name || `Potje ${game.played_at}`}
        backHref={game.session_id ? `/sessions/${game.session_id}` : '/dashboard'}
        action={
          <span className={`text-xs px-2 py-1 rounded-full ${
            game.status === 'active' ? 'bg-green-900 text-green-300' :
            game.status === 'completed' ? 'bg-gray-800 text-gray-400' :
            'bg-red-900 text-red-400'
          }`}>
            {game.status === 'active' ? 'Actief' : game.status === 'completed' ? 'Klaar' : 'Gestopt'}
          </span>
        }
      />
      <div className="pb-4">
        <Scoreboard game={game} initialHands={hands} players={players} />
      </div>
      <BottomNav />
    </div>
  )
}
