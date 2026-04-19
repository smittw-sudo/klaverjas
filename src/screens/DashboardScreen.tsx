import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { getActiveSession } from '@/lib/db/sessions'
import { getActiveGame, getRecentGames } from '@/lib/db/games'
import { getIndividualStats } from '@/lib/db/stats'
import BottomNav from '@/components/ui/BottomNav'
import DeleteGameButton from '@/components/game/DeleteGameButton'
import type { Session, Game } from '@/lib/supabase/types'

export default function DashboardScreen() {
  const navigate = useNavigate()
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [activeGame, setActiveGame] = useState<Game | null>(null)
  const [recentGames, setRecentGames] = useState<Game[]>([])
  const [sessionStats, setSessionStats] = useState<Array<{ playerId: string; displayName: string; totalPoints: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [session, game, games] = await Promise.all([
        getActiveSession(),
        getActiveGame(),
        getRecentGames(5),
      ])
      setActiveSession(session)
      setActiveGame(game)
      setRecentGames(games)
      if (session) {
        const stats = await getIndividualStats(undefined, session.id)
        setSessionStats(stats)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    navigate('/auth/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Laden…</div>

  return (
    <div className="min-h-screen pb-20">
      <header className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🃏</span>
          <h1 className="text-xl font-bold">Klaverjas</h1>
        </div>
        <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-white px-3 py-2">
          Uitloggen
        </button>
      </header>

      <main className="px-4 py-4 space-y-6 max-w-lg mx-auto">
        {activeSession && (
          <section className="bg-gray-900 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-green-400 font-medium uppercase tracking-wide">Actieve sessie</p>
                <h2 className="text-lg font-bold">{activeSession.name}</h2>
              </div>
              <Link to={`/sessions/${activeSession.id}`} className="text-sm text-gray-400 hover:text-white">
                Details →
              </Link>
            </div>

            {sessionStats.length > 0 && (
              <div className="space-y-1">
                {sessionStats.slice(0, 4).map((s, i) => (
                  <div key={s.playerId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-4">{i + 1}.</span>
                      <span className="text-white">{s.displayName}</span>
                    </div>
                    <span className="font-mono font-semibold">{s.totalPoints}</span>
                  </div>
                ))}
              </div>
            )}

            {activeGame && (
              <Link
                to={`/games/${activeGame.id}`}
                className="mt-3 block w-full py-2.5 bg-green-700 hover:bg-green-600 text-white text-center text-sm font-semibold rounded-lg transition-colors"
              >
                Doorgaan met potje →
              </Link>
            )}
          </section>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/games/new"
            className="flex flex-col items-center gap-2 p-5 bg-green-900 hover:bg-green-800 border border-green-700 rounded-xl text-center transition-colors"
          >
            <span className="text-3xl">🃏</span>
            <span className="font-semibold text-sm">Nieuw potje</span>
          </Link>
          <Link
            to="/sessions/new"
            className="flex flex-col items-center gap-2 p-5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-center transition-colors"
          >
            <span className="text-3xl">📅</span>
            <span className="font-semibold text-sm">Nieuwe sessie</span>
          </Link>
        </div>

        {recentGames.length > 0 && (
          <section>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Recente potjes</h3>
            <div className="space-y-2">
              {recentGames.map(game => (
                <div key={game.id} className="flex items-center gap-1 bg-gray-900 rounded-lg border border-gray-800">
                  <Link
                    to={`/games/${game.id}`}
                    className="flex flex-1 items-center justify-between p-3 hover:bg-gray-800 rounded-l-lg transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{game.name || `Potje ${game.played_at}`}</p>
                      <p className="text-xs text-gray-500">{game.played_at} · {game.variant}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        game.status === 'active' ? 'bg-green-900 text-green-300' :
                        game.status === 'completed' ? 'bg-gray-800 text-gray-400' :
                        'bg-red-900 text-red-400'
                      }`}>
                        {game.status === 'active' ? 'Actief' : game.status === 'completed' ? 'Klaar' : 'Gestopt'}
                      </span>
                      <span className="text-gray-600">→</span>
                    </div>
                  </Link>
                  <DeleteGameButton
                    gameId={game.id}
                    onDeleted={() => setRecentGames(prev => prev.filter(g => g.id !== game.id))}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {recentGames.length === 0 && !activeSession && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">🃏</p>
            <p>Nog geen potjes gespeeld.</p>
            <p className="text-sm mt-1">Start een nieuw potje om te beginnen!</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
