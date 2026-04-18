import { notFound } from 'next/navigation'
import { getGame, getGamePlayers } from '@/lib/db/games'
import { getHands } from '@/lib/db/hands'
import PageHeader from '@/components/ui/PageHeader'
import Scoreboard from '@/components/game/Scoreboard'
import BottomNav from '@/components/ui/BottomNav'

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [game, gamePlayers, hands] = await Promise.all([
    getGame(id),
    getGamePlayers(id),
    getHands(id),
  ])

  if (!game) notFound()

  const players = gamePlayers.map(gp => ({
    id: gp.player_id,
    display_name: gp.player.display_name,
    seat_position: gp.seat_position,
  }))

  const title = game.name || `Potje ${game.played_at}`

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title={title}
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
        <Scoreboard
          game={game}
          initialHands={hands}
          players={players}
        />
      </div>

      <BottomNav />
    </div>
  )
}
