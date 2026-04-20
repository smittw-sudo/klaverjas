import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAllGames, getAllGamesBySession, type GameWithPlayers } from '@/lib/db/games'
import { getSession, getSessions } from '@/lib/db/sessions'
import PageHeader from '@/components/ui/PageHeader'
import BottomNav from '@/components/ui/BottomNav'
import type { Session } from '@/lib/supabase/types'

interface GamesByGroup {
  label: string
  sessionId: string | null
  games: GameWithPlayers[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function GameCard({ game }: { game: GameWithPlayers }) {
  const teamALabel = game.teamA.join(' & ') || 'Team A'
  const teamBLabel = game.teamB.join(' & ') || 'Team B'
  const aWins = game.handCount > 0 && game.teamAScore > game.teamBScore
  const bWins = game.handCount > 0 && game.teamBScore > game.teamAScore

  return (
    <Link
      to={`/games/${game.id}`}
      className="block bg-gray-900 rounded-xl border border-gray-800 p-4 hover:bg-gray-800 active:bg-gray-800 transition-colors"
    >
      {/* Header: datum + status */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">{formatDate(game.played_at)}{game.name ? ` · ${game.name}` : ''}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{game.handCount}/16</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            game.status === 'active' ? 'bg-green-900 text-green-300' :
            game.status === 'completed' ? 'bg-gray-700 text-gray-300' :
            'bg-red-900 text-red-400'
          }`}>
            {game.status === 'active' ? 'Actief' : game.status === 'completed' ? 'Klaar' : 'Gestopt'}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-center">
          <p className={`font-semibold text-sm leading-tight ${aWins ? 'text-green-400' : 'text-gray-300'}`}>
            {teamALabel}
          </p>
          <p className={`font-mono font-bold text-2xl mt-0.5 ${aWins ? 'text-green-400' : 'text-white'}`}>
            {game.teamAScore}
          </p>
        </div>

        <div className="text-gray-600 text-sm font-semibold shrink-0">vs</div>

        <div className="flex-1 text-center">
          <p className={`font-semibold text-sm leading-tight ${bWins ? 'text-green-400' : 'text-gray-300'}`}>
            {teamBLabel}
          </p>
          <p className={`font-mono font-bold text-2xl mt-0.5 ${bWins ? 'text-green-400' : 'text-white'}`}>
            {game.teamBScore}
          </p>
        </div>
      </div>
    </Link>
  )
}

// Session-specific history view, mounted at /sessions/:sessionId/history
export function SessionHistoryScreen() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [games, setGames] = useState<GameWithPlayers[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSession(sessionId!),
      getAllGames(sessionId!),
    ]).then(([s, g]) => {
      setSession(s)
      setGames(g)
      setLoading(false)
    })
  }, [sessionId])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Laden…</div>

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title={session ? `Potjes: ${session.name}` : 'Potjes'}
        backHref={sessionId ? `/sessions/${sessionId}` : '/dashboard'}
      />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-3">
        {games.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🃏</p>
            <p>Nog geen potjes in deze sessie.</p>
          </div>
        ) : (
          games.map(game => <GameCard key={game.id} game={game} />)
        )}
      </main>
      <BottomNav />
    </div>
  )
}

// Global history — all games grouped by session
export default function HistoryScreen() {
  const [groups, setGroups] = useState<GamesByGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllGamesBySession(), getSessions()]).then(([games, sessions]) => {
      const sessionMap = new Map(sessions.map(s => [s.id, s.name]))

      const groupMap = new Map<string, GamesByGroup>()

      for (const game of games) {
        const key = game.session_id ?? '__loose__'
        if (!groupMap.has(key)) {
          const label = game.session_id
            ? (sessionMap.get(game.session_id) ?? 'Sessie')
            : 'Losse potjes'
          groupMap.set(key, { label, sessionId: game.session_id, games: [] })
        }
        groupMap.get(key)!.games.push(game)
      }

      setGroups(Array.from(groupMap.values()))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Laden…</div>

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Geschiedenis" backHref="/dashboard" />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {groups.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🃏</p>
            <p>Nog geen potjes gespeeld.</p>
            <p className="text-sm mt-1">Start een nieuw potje om te beginnen!</p>
          </div>
        ) : (
          groups.map(group => (
            <section key={group.sessionId ?? '__loose__'}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  {group.label}
                </h2>
                {group.sessionId && (
                  <Link
                    to={`/sessions/${group.sessionId}/history`}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    Alles →
                  </Link>
                )}
              </div>
              <div className="space-y-3">
                {group.games.map(game => <GameCard key={game.id} game={game} />)}
              </div>
            </section>
          ))
        )}
      </main>
      <BottomNav />
    </div>
  )
}
