import { notFound } from 'next/navigation'
import { getSession } from '@/lib/db/sessions'
import { getIndividualStats, getGroupStats } from '@/lib/db/stats'
import PageHeader from '@/components/ui/PageHeader'
import BottomNav from '@/components/ui/BottomNav'

export default async function SessionStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, stats, groupStats] = await Promise.all([
    getSession(id),
    getIndividualStats(undefined, id),
    getGroupStats(id),
  ])

  if (!session) notFound()

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title={`Stats: ${session.name}`} backHref={`/sessions/${id}`} />

      <main className="px-4 py-4 space-y-5 max-w-lg mx-auto">
        {groupStats && (
          <section className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
              <p className="text-2xl font-bold">{groupStats.totalHands}</p>
              <p className="text-xs text-gray-500 mt-0.5">Handjes</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
              <p className="text-2xl font-bold">{groupStats.totalNat}</p>
              <p className="text-xs text-gray-500 mt-0.5">NAT ({groupStats.natPct}%)</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
              <p className="text-2xl font-bold">{groupStats.totalPit}</p>
              <p className="text-xs text-gray-500 mt-0.5">PIT ({groupStats.pitPct}%)</p>
            </div>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Individueel</h3>
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
                  <span className="font-mono font-bold text-lg">{s.totalPoints} pt</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                  <div>
                    <p className="text-white font-medium">{s.troefMade}×</p>
                    <p>Troef gemaakt</p>
                  </div>
                  <div>
                    <p className={`font-medium ${s.natPct > 30 ? 'text-red-400' : 'text-white'}`}>{s.natPct}%</p>
                    <p>Nat%</p>
                  </div>
                  <div>
                    <p className="text-white font-medium">{s.pitsAsTrumpMaker + s.pitsAsMaat}×</p>
                    <p>Pits</p>
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
            <p>Nog geen handjes gespeeld in deze sessie.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
