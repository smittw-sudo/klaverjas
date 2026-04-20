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
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🃏</span>
          <h1 className="text-xl font-bold tracking-tight">Klaverjas</h1>
        </div>
        <button onClick={handleSignOut} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg transition-colors">
          Uitloggen
        </button>
      </header>

      <main className="px-4 space-y-5 max-w-lg mx-auto">

        {/* ── Actieve sessie ── */}
        {activeSession && (
          <section className="relative rounded-2xl overflow-hidden border border-green-800/60 bg-gradient-to-br from-green-950/80 to-gray-900">
            {/* Accent stripe */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-2xl" />
            <div className="px-5 pt-4 pb-3 pl-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold text-green-400 uppercase tracking-widest mb-0.5">Actieve sessie</p>
                  <h2 className="text-lg font-bold text-white leading-tight">{activeSession.name}</h2>
                </div>
                <Link to={`/sessions/${activeSession.id}`} className="text-xs text-green-400 hover:text-green-300 px-2 py-1 mt-0.5 shrink-0">
                  Details →
                </Link>
              </div>

              {sessionStats.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {sessionStats.slice(0, 4).map((s, i) => (
                    <div key={s.playerId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-gray-500 text-xs w-4 text-center">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                        </span>
                        <span className="text-sm text-white font-medium">{s.displayName}</span>
                      </div>
                      <span className="font-mono font-semibold text-sm text-green-300">{s.totalPoints}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeGame && (
                <Link
                  to={`/games/${activeGame.id}`}
                  className="mt-4 mb-1 flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Doorgaan met potje →
                </Link>
              )}
            </div>
          </section>
        )}

        {/* ── Acties ── */}
        <section className="grid grid-cols-2 gap-3">
          <Link
            to="/games/new"
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-green-800/40 hover:bg-green-800/60 active:bg-green-800/70 border border-green-700/60 transition-colors"
          >
            <span className="text-3xl">🃏</span>
            <span className="font-semibold text-sm text-green-200">Nieuw potje</span>
          </Link>
          <Link
            to="/sessions/new"
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-blue-900/30 hover:bg-blue-900/50 active:bg-blue-900/60 border border-blue-800/50 transition-colors"
          >
            <span className="text-3xl">📅</span>
            <span className="font-semibold text-sm text-blue-200">Nieuwe sessie</span>
          </Link>
          <Link
            to="/history"
            className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-gray-800/60 hover:bg-gray-800/80 active:bg-gray-700/60 border border-gray-700/60 transition-colors"
          >
            <span className="text-xl">📜</span>
            <span className="font-semibold text-sm text-gray-200">Geschiedenis</span>
          </Link>
        </section>

        {/* ── Recente potjes ── */}
        {recentGames.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Recente potjes</h3>
            <div className="space-y-2">
              {recentGames.map(game => (
                <div key={game.id} className="flex items-center gap-1 bg-gray-900/80 rounded-xl border border-gray-800">
                  <Link
                    to={`/games/${game.id}`}
                    className="flex flex-1 items-center justify-between px-4 py-3 hover:bg-gray-800/60 rounded-l-xl transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{game.name || `Potje ${game.played_at}`}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{game.played_at} · {game.variant}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        game.status === 'active'    ? 'bg-green-900 text-green-300' :
                        game.status === 'completed' ? 'bg-gray-800 text-gray-400'  :
                                                      'bg-red-900 text-red-400'
                      }`}>
                        {game.status === 'active' ? 'Actief' : game.status === 'completed' ? 'Klaar' : 'Gestopt'}
                      </span>
                      <span className="text-gray-600 text-sm">→</span>
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
          <div className="text-center py-16 text-gray-500">
            <p className="text-5xl mb-4">🃏</p>
            <p className="font-medium">Nog geen potjes gespeeld.</p>
            <p className="text-sm mt-1 text-gray-600">Start een nieuw potje om te beginnen!</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
