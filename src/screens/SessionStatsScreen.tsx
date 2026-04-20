import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSession } from '@/lib/db/sessions'
import { getIndividualStats, getDuoStats, getGroupStats } from '@/lib/db/stats'
import PageHeader from '@/components/ui/PageHeader'
import BottomNav from '@/components/ui/BottomNav'
import type { Session } from '@/lib/supabase/types'
import type { IndividualStats, DuoStats } from '@/lib/db/stats'

export default function SessionStatsScreen() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [stats, setStats] = useState<IndividualStats[]>([])
  const [duos, setDuos] = useState<DuoStats[]>([])
  const [groupStats, setGroupStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSession(sessionId!),
      getIndividualStats(undefined, sessionId!),
      getDuoStats(sessionId!),
      getGroupStats(sessionId!),
    ]).then(([s, st, ds, gs]) => {
      setSession(s); setStats(st); setDuos(ds); setGroupStats(gs)
      setLoading(false)
    })
  }, [sessionId])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Laden…</div>
  if (!session) return <div className="min-h-screen flex items-center justify-center text-gray-400">Sessie niet gevonden.</div>

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title={`Stats: ${session.name}`} backHref={`/sessions/${sessionId}`} />

      <main className="px-4 py-4 space-y-5 max-w-lg mx-auto">
        {/* Geen voltooide potjes */}
        {!groupStats && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">📊</p>
            <p>Nog geen afgesloten potjes in deze sessie.</p>
            <p className="text-xs text-gray-600 mt-1">Statistieken verschijnen na het eerste volledige potje (16 handjes).</p>
          </div>
        )}

        {groupStats && (
          <>
            {/* Groep overzicht */}
            <section className="grid grid-cols-4 gap-2">
              <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
                <p className="text-2xl font-bold">{groupStats.totalGames}</p>
                <p className="text-xs text-gray-500 mt-0.5">Potjes</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
                <p className="text-2xl font-bold">{groupStats.totalHands}</p>
                <p className="text-xs text-gray-500 mt-0.5">Handjes</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
                <p className="text-2xl font-bold text-red-400">{groupStats.avgNatsPerGame}</p>
                <p className="text-xs text-gray-500 mt-0.5">NAT/ptj</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
                <p className="text-2xl font-bold text-yellow-400">{groupStats.avgPitsPerGame}</p>
                <p className="text-xs text-gray-500 mt-0.5">PIT/ptj</p>
              </div>
            </section>

            {/* Individueel ranglijst */}
            <section>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Ranglijst</h3>
              <div className="space-y-2">
                {stats.map((s, i) => (
                  <Link
                    key={s.playerId}
                    to={`/players/${s.playerId}?session=${sessionId}`}
                    className="block bg-gray-900 rounded-xl p-4 border border-gray-800 active:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                        </span>
                        <span className="font-semibold">{s.displayName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xl">{s.totalPoints}</span>
                        <p className="text-xs text-gray-500">{s.avgPointsPerGame}/potje</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <p className="font-semibold">{s.gamesCompleted}</p>
                        <p className="text-gray-500">Potjes</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{s.troefMade}</p>
                        <p className="text-gray-500">Troef</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-semibold ${s.natPct > 30 ? 'text-red-400' : s.natPct > 20 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {s.natPct}%
                        </p>
                        <p className="text-gray-500">Nat%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-yellow-400 font-semibold">{s.avgPitsPerGame}</p>
                        <p className="text-gray-500">Pit/ptj</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Duo combinaties */}
            {duos.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Combinaties</h3>
                <div className="space-y-2">
                  {duos.map((duo, i) => (
                    <div key={`${duo.playerAId}-${duo.playerBId}`} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm w-5 shrink-0">{i + 1}.</span>
                          <span className="font-semibold text-sm">
                            <Link to={`/players/${duo.playerAId}?session=${sessionId}`} className="text-blue-400">{duo.playerAName}</Link>
                            <span className="text-gray-500 mx-1">&</span>
                            <Link to={`/players/${duo.playerBId}?session=${sessionId}`} className="text-orange-400">{duo.playerBName}</Link>
                          </span>
                        </div>
                        <span className="font-mono font-bold shrink-0">{duo.avgPoints} <span className="text-xs text-gray-500 font-normal">gem</span></span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center">
                          <p className="font-semibold">{duo.gamesCompleted}</p>
                          <p className="text-gray-500">Potjes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-green-400 font-semibold">{duo.winsAsSpelend}</p>
                          <p className="text-gray-500">Wins</p>
                        </div>
                        <div className="text-center">
                          <p className={`font-semibold ${duo.natPct > 30 ? 'text-red-400' : 'text-white'}`}>{duo.natPct}%</p>
                          <p className="text-gray-500">Nat%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-yellow-400 font-semibold">{duo.pitsAsSpelend}</p>
                          <p className="text-gray-500">Pits</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
