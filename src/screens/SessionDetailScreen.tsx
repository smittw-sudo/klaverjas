import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSession, closeSession } from '@/lib/db/sessions'
import { getGamesBySession } from '@/lib/db/games'
import { getIndividualStats } from '@/lib/db/stats'
import PageHeader from '@/components/ui/PageHeader'
import BottomNav from '@/components/ui/BottomNav'
import type { Session, Game } from '@/lib/supabase/types'

export default function SessionDetailScreen() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [stats, setStats] = useState<Array<{ playerId: string; displayName: string; totalPoints: number }>>([])
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    async function load() {
      const [s, g, st] = await Promise.all([
        getSession(sessionId!),
        getGamesBySession(sessionId!),
        getIndividualStats(undefined, sessionId!),
      ])
      setSession(s)
      setGames(g)
      setStats(st)
      setLoading(false)
    }
    load()
  }, [sessionId])

  async function handleClose() {
    if (!confirm('Sessie afsluiten?')) return
    setClosing(true)
    await closeSession(sessionId!, new Date().toISOString().slice(0, 10))
    setSession(prev => prev ? { ...prev, end_date: new Date().toISOString().slice(0, 10) } : prev)
    setClosing(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Laden…</div>
  if (!session) return <div className="min-h-screen flex items-center justify-center text-gray-400">Sessie niet gevonden.</div>

  const isActive = !session.end_date

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title={session.name}
        backHref="/sessions"
        action={
          <div className="flex items-center gap-3">
            <Link to={`/sessions/${sessionId}/history`} className="text-sm text-gray-400 hover:text-white px-2 py-1">
              Potjes
            </Link>
            <Link to={`/sessions/${sessionId}/stats`} className="text-sm text-gray-400 hover:text-white px-2 py-1">
              Stats
            </Link>
          </div>
        }
      />

      <main className="px-4 py-4 space-y-5 max-w-lg mx-auto">
        <div className="text-sm text-gray-400">
          {session.start_date}
          {session.end_date ? ` – ${session.end_date}` : ' (lopend)'}
          {session.description && <p className="mt-1">{session.description}</p>}
        </div>

        {stats.length > 0 && (
          <section className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Ranglijst</h3>
            <div className="space-y-2">
              {stats.map((s, i) => (
                <div key={s.playerId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold w-6 text-center ${
                      i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'
                    }`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                    <span className="font-medium">{s.displayName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold">{s.totalPoints}</span>
                    <span className="text-xs text-gray-500 ml-1">pt</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <Link
          to={`/games/new?session=${sessionId}`}
          className="block w-full py-3 bg-green-700 hover:bg-green-600 text-white text-center font-semibold rounded-xl transition-colors"
        >
          + Nieuw potje in deze sessie
        </Link>

        {games.length > 0 && (
          <section>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Potjes ({games.length})</h3>
            <div className="space-y-2">
              {games.map(game => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="flex items-center justify-between p-3 bg-gray-900 hover:bg-gray-800 rounded-lg border border-gray-800 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{game.name || `Potje ${game.played_at}`}</p>
                    <p className="text-xs text-gray-500">{game.played_at}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    game.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {game.status === 'active' ? 'Actief' : 'Klaar'}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {isActive && (
          <button
            onClick={handleClose}
            disabled={closing}
            className="w-full py-2.5 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {closing ? 'Afsluiten…' : 'Sessie afsluiten'}
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
