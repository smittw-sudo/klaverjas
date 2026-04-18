import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/db/sessions'
import { getGamesBySession } from '@/lib/db/games'
import { getIndividualStats } from '@/lib/db/stats'
import PageHeader from '@/components/ui/PageHeader'
import BottomNav from '@/components/ui/BottomNav'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, games, stats] = await Promise.all([
    getSession(id),
    getGamesBySession(id),
    getIndividualStats(undefined, id),
  ])

  if (!session) notFound()

  const isActive = !session.end_date

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title={session.name}
        backHref="/sessions"
        action={
          <Link
            href={`/sessions/${id}/stats`}
            className="text-sm text-gray-400 hover:text-white px-2 py-1"
          >
            Stats
          </Link>
        }
      />

      <main className="px-4 py-4 space-y-5 max-w-lg mx-auto">
        {/* Session info */}
        <div className="text-sm text-gray-400">
          {session.start_date}
          {session.end_date ? ` – ${session.end_date}` : ' (lopend)'}
          {session.description && <p className="mt-1">{session.description}</p>}
        </div>

        {/* Ranglijst */}
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

        {/* New game button */}
        <Link
          href={`/games/new?session=${id}`}
          className="block w-full py-3 bg-green-700 hover:bg-green-600 text-white text-center font-semibold rounded-xl transition-colors"
        >
          + Nieuw potje in deze sessie
        </Link>

        {/* Games list */}
        {games.length > 0 && (
          <section>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Potjes ({games.length})</h3>
            <div className="space-y-2">
              {games.map(game => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
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
          <form action={`/api/sessions/${id}/close`} method="POST">
            <button
              type="submit"
              className="w-full py-2.5 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white text-sm rounded-lg transition-colors"
            >
              Sessie afsluiten
            </button>
          </form>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
