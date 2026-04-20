import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getIndividualStats, getDuoStats, getGroupStats } from '@/lib/db/stats'
import { getSessions } from '@/lib/db/sessions'
import PageHeader from '@/components/ui/PageHeader'
import BottomNav from '@/components/ui/BottomNav'
import type { Session } from '@/lib/supabase/types'
import type { IndividualStats, DuoStats } from '@/lib/db/stats'

export default function StatsScreen() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') ?? undefined
  const [stats, setStats] = useState<IndividualStats[]>([])
  const [duos, setDuos] = useState<DuoStats[]>([])
  const [groupStats, setGroupStats] = useState<any>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getIndividualStats(undefined, sessionId),
      getDuoStats(sessionId),
      getGroupStats(sessionId),
      getSessions(),
    ]).then(([st, ds, gs, ses]) => {
      setStats(st); setDuos(ds); setGroupStats(gs); setSessions(ses)
      setLoading(false)
    })
  }, [sessionId])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Laden…</div>

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Statistieken" />

      <main className="px-4 py-4 space-y-5 max-w-lg mx-auto">
        {/* Sessie filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link to="/stats" className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!sessionId ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            Alle tijd
          </Link>
          {sessions.map(s => (
            <Link key={s.id} to={`/stats?session=${s.id}`} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${sessionId === s.id ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {s.name}
            </Link>
          ))}
        </div>

        {/* Geen voltooide potjes */}
        {!groupStats && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">📊</p>
            <p>Nog geen afgesloten potjes.</p>
            <p className="text-sm mt-1 text-gray-600">Statistieken verschijnen na het eerste volledige potje (16 handjes).</p>
          </div>
        )}

        {groupStats && (
          <>
            {/* Groep stats */}
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
                <p className="text-xs text-gray-500 mt-0.5">NAT/potje</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
                <p className="text-2xl font-bold text-yellow-400">{groupStats.avgPitsPerGame}</p>
                <p className="text-xs text-gray-500 mt-0.5">PIT/potje</p>
              </div>
            </section>

            {/* Ranglijst */}
            <section>
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Ranglijst</h3>
              <p className="text-xs text-gray-600 mb-3">Alleen afgesloten potjes (16 handjes)</p>
              <div className="space-y-2">
                {stats.map((s, i) => (
                  <Link
                    key={s.playerId}
                    to={`/players/${s.playerId}${sessionId ? `?session=${sessionId}` : ''}`}
                    className="block bg-gray-900 rounded-xl p-4 border border-gray-800 active:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                        </span>
                        <span className="font-semibold">{s.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="font-mono font-bold text-xl">{s.totalPoints}</span>
                          <p className="text-xs text-gray-500">{s.avgPointsPerGame}/potje</p>
                        </div>
                        <span className="text-gray-600 text-sm">→</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <p className="text-white font-semibold">{s.gamesCompleted}</p>
                        <p className="text-gray-500">Potjes</p>
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
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Combinaties</h3>
                <p className="text-xs text-gray-600 mb-3">Gem. punten per handje samen (spelend team)</p>
                <div className="space-y-2">
                  {duos.map((duo, i) => (
                    <div key={`${duo.playerAId}-${duo.playerBId}`} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium w-5 shrink-0">{i + 1}.</span>
                          <span className="font-semibold text-sm">
                            <Link to={`/players/${duo.playerAId}${sessionId ? `?session=${sessionId}` : ''}`} className="text-blue-400 hover:text-blue-300">
                              {duo.playerAName}
                            </Link>
                            <span className="text-gray-500 mx-1">&</span>
                            <Link to={`/players/${duo.playerBId}${sessionId ? `?session=${sessionId}` : ''}`} className="text-orange-400 hover:text-orange-300">
                              {duo.playerBName}
                            </Link>
                          </span>
                        </div>
                        <span className="font-mono font-bold shrink-0">{duo.avgPoints} <span className="text-xs text-gray-500 font-normal">gem</span></span>
                      </div>

                      <div className="grid grid-cols-5 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-white font-semibold">{duo.gamesCompleted}</p>
                          <p className="text-gray-500">Potjes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-semibold">{duo.asSpelend}</p>
                          <p className="text-gray-500">Spelend</p>
                        </div>
                        <div className="text-center">
                          <p className="text-green-400 font-semibold">{duo.winsAsSpelend}</p>
                          <p className="text-gray-500">Wins</p>
                        </div>
                        <div className="text-center">
                          <p className={`font-semibold ${duo.natPct > 30 ? 'text-red-400' : duo.natPct > 20 ? 'text-yellow-400' : 'text-white'}`}>
                            {duo.natPct}%
                          </p>
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
