import { getIndividualStats, getGroupStats } from '@/lib/db/stats'
import { getSessions } from '@/lib/db/sessions'
import PageHeader from '@/components/ui/PageHeader'
import BottomNav from '@/components/ui/BottomNav'
import Link from 'next/link'

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session: sessionId } = await searchParams

  const [stats, groupStats, sessions] = await Promise.all([
    getIndividualStats(undefined, sessionId),
    getGroupStats(sessionId),
    getSessions(),
  ])

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Statistieken" />

      <main className="px-4 py-4 space-y-5 max-w-lg mx-auto">
        {/* Session filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/stats"
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !sessionId ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Alle tijd
          </Link>
          {sessions.map(s => (
            <Link
              key={s.id}
              href={`/stats?session=${s.id}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sessionId === s.id ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>

        {/* Group stats */}
        {groupStats && (
          <section className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
              <p className="text-2xl font-bold">{groupStats.totalGames}</p>
              <p className="text-xs text-gray-500 mt-0.5">Potjes</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
              <p className="text-2xl font-bold text-red-400">{groupStats.natPct}%</p>
              <p className="text-xs text-gray-500 mt-0.5">NAT overall</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
              <p className="text-2xl font-bold text-yellow-400">{groupStats.totalPit}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pits</p>
            </div>
          </section>
        )}

        {/* Ranglijst */}
        <section>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Ranglijst</h3>
          <div className="space-y-3">
            {stats.map((s, i) => (
              <div key={s.playerId} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <span className="font-semibold">{s.displayName}</span>
                  </div>
                  <span className="font-mono font-bold text-xl">{s.totalPoints}</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-white font-semibold">{s.handsPlayed}</p>
                    <p className="text-gray-500">Handjes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">{s.troefMade}</p>
                    <p className="text-gray-500">Troef gem.</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-semibold ${s.natPct > 30 ? 'text-red-400' : s.natPct > 20 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {s.natPct}%
                    </p>
                    <p className="text-gray-500">Nat%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-yellow-400 font-semibold">{s.pitsAsTrumpMaker + s.pitsAsMaat}</p>
                    <p className="text-gray-500">Pits</p>
                  </div>
                </div>

                {s.favoriteTrump && (
                  <p className="text-xs text-gray-500 mt-2">
                    Favoriete troef: <span className="text-white capitalize">{s.favoriteTrump}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {stats.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">📊</p>
            <p>Nog geen statistieken beschikbaar.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
