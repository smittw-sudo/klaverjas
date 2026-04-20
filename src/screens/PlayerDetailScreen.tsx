import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import BottomNav from '@/components/ui/BottomNav'
import { getIndividualStats, getDuoStats } from '@/lib/db/stats'
import { getSessions } from '@/lib/db/sessions'
import type { IndividualStats, DuoStats } from '@/lib/db/stats'
import type { Session } from '@/lib/supabase/types'

const SUIT_LABELS: Record<string, string> = {
  harten: '♥ Harten', schoppen: '♠ Schoppen', klaveren: '♣ Klaveren', ruiten: '♦ Ruiten'
}
const SUIT_CLASSES: Record<string, string> = {
  harten: 'text-red-400', schoppen: 'text-slate-300', klaveren: 'text-green-400', ruiten: 'text-orange-400'
}

export default function PlayerDetailScreen() {
  const { playerId } = useParams<{ playerId: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') ?? undefined

  const [stats, setStats] = useState<IndividualStats | null>(null)
  const [duos, setDuos] = useState<DuoStats[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getIndividualStats(playerId, sessionId),
      getDuoStats(sessionId),
      getSessions(),
    ]).then(([all, allDuos, ses]) => {
      setStats(all[0] ?? null)
      setDuos(allDuos.filter(d => d.playerAId === playerId || d.playerBId === playerId).sort((a, b) => b.avgPoints - a.avgPoints))
      setSessions(ses)
      setLoading(false)
    })
  }, [playerId, sessionId])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Laden…</div>

  const backHref = sessionId ? `/sessions/${sessionId}/stats` : '/stats'

  if (!stats) return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Speler" backHref={backHref} />
      <div className="flex items-center justify-center pt-20 text-gray-500">
        <div className="text-center">
          <p className="text-4xl mb-3">📊</p>
          <p>Nog geen afgesloten potjes.</p>
          <p className="text-xs text-gray-600 mt-1">Statistieken verschijnen na het eerste volledige potje.</p>
        </div>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title={stats.displayName} backHref={backHref} />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-5">
        {/* Sessie filter */}
        {sessions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link to={`/players/${playerId}`} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!sessionId ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              Alle tijd
            </Link>
            {sessions.map(s => (
              <Link key={s.id} to={`/players/${playerId}?session=${s.id}`} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${sessionId === s.id ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {s.name}
              </Link>
            ))}
          </div>
        )}

        {/* Hoofdcijfers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 col-span-2">
            <p className="text-xs text-gray-500 mb-1">Totaal punten</p>
            <p className="text-4xl font-bold font-mono">{stats.totalPoints}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.gamesCompleted} afgesloten potje{stats.gamesCompleted !== 1 ? 's' : ''} · gem. {stats.avgPointsPerGame}/potje
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Troef gemaakt</p>
            <p className="text-2xl font-bold">{stats.troefMade}×</p>
            <p className={`text-sm mt-1 font-semibold ${stats.natPct > 30 ? 'text-red-400' : stats.natPct > 20 ? 'text-yellow-400' : 'text-green-400'}`}>
              {stats.natPct}% nat
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{stats.avgNatsPerGame} nat/potje</p>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Pits</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.pitsTotal}×</p>
            <p className="text-xs text-gray-500 mt-1">{stats.avgPitsPerGame} pit/potje</p>
          </div>
        </div>

        {/* Troef details */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm font-semibold text-gray-300 mb-3">Als troef-maker</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <p className="text-gray-500 text-xs mb-1">Gemaakt</p>
              <p className="font-bold text-lg">{stats.troefMade}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs mb-1">Gewonnen</p>
              <p className="text-green-400 font-bold text-lg">{stats.troefMade - stats.troefNat}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs mb-1">NAT</p>
              <p className="text-red-400 font-bold text-lg">{stats.troefNat}</p>
            </div>
          </div>
          {stats.favoriteTrump && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-500">Favoriete troef</p>
              <p className={`font-semibold mt-0.5 ${SUIT_CLASSES[stats.favoriteTrump] ?? ''}`}>
                {SUIT_LABELS[stats.favoriteTrump] ?? stats.favoriteTrump}
              </p>
            </div>
          )}
        </div>

        {/* Koppel-stats */}
        {duos.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-2">Als koppel</p>
            <div className="space-y-2">
              {duos.map(duo => {
                const partnerName = duo.playerAId === playerId ? duo.playerBName : duo.playerAName
                const partnerId = duo.playerAId === playerId ? duo.playerBId : duo.playerAId
                return (
                  <div key={`${duo.playerAId}-${duo.playerBId}`} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🤝</span>
                        <Link to={`/players/${partnerId}${sessionId ? `?session=${sessionId}` : ''}`} className="font-semibold text-blue-400 hover:text-blue-300">
                          {partnerName}
                        </Link>
                      </div>
                      <span className="font-mono font-bold">{duo.avgPoints} <span className="text-xs text-gray-500 font-normal">gem/hand</span></span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div className="text-center">
                        <p className="font-semibold">{duo.gamesCompleted}</p>
                        <p className="text-gray-500">Potjes</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{duo.asSpelend}</p>
                        <p className="text-gray-500">Spelend</p>
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
                )
              })}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
