'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { use, Suspense } from 'react'
import RoemPanel, { type RoemEntry } from '@/components/game/RoemPanel'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/client'
import { TRUMP_DISPLAY } from '@/lib/utils/trumpDisplay'
import type { TrumpSuit } from '@/lib/supabase/types'

function RoemPageContent({ gameId, n }: { gameId: string; n: string }) {
  const handNumber = parseInt(n)
  const router = useRouter()
  const searchParams = useSearchParams()

  const trumpSuit = searchParams.get('suit') as TrumpSuit
  const kraakType = searchParams.get('kraak') ?? 'geen'
  const dealerSeat = searchParams.get('dealer') ?? '1'
  const trumpMakerSeat = searchParams.get('trumpMaker') ?? '2'

  const [gamePlayers, setGamePlayers] = useState<Array<{ seat_position: number; player: { display_name: string } }>>([])
  const [entries, setEntries] = useState<RoemEntry[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('game_players')
      .select('seat_position, player:players(display_name)')
      .eq('game_id', gameId)
      .then(({ data }) => {
        if (data) setGamePlayers(data as unknown as typeof gamePlayers)
      })
  }, [gameId])

  if (!trumpSuit) return <div className="p-4 text-red-400">Geen troefkleur geselecteerd</div>

  const d = TRUMP_DISPLAY[trumpSuit]
  const trumpMakerSeatNum = parseInt(trumpMakerSeat)
  const trumpMakerPlayer = gamePlayers.find(gp => gp.seat_position === trumpMakerSeatNum)
  const isTeamA = (seat: number) => seat === 1 || seat === 3
  const spelendIsTeamA = isTeamA(trumpMakerSeatNum)

  const spelendPlayers = gamePlayers
    .filter(gp => isTeamA(gp.seat_position) === spelendIsTeamA)
    .map(gp => gp.player?.display_name)
    .join(' & ')

  const tegenPlayers = gamePlayers
    .filter(gp => isTeamA(gp.seat_position) !== spelendIsTeamA)
    .map(gp => gp.player?.display_name)
    .join(' & ')

  function addEntry(entry: RoemEntry) {
    setEntries(prev => [...prev, entry])
  }

  function removeEntry(index: number) {
    setEntries(prev => prev.filter((_, i) => i !== index))
  }

  function handleContinue() {
    const spelendRoem = entries.filter(e => e.team === 'spelend').reduce((s, e) => s + e.punten, 0)
    const tegenRoem = entries.filter(e => e.team === 'tegen').reduce((s, e) => s + e.punten, 0)
    const encoded = encodeURIComponent(JSON.stringify(entries))
    const params = new URLSearchParams({
      suit: trumpSuit,
      kraak: kraakType,
      dealer: dealerSeat,
      trumpMaker: trumpMakerSeat,
      spelendRoem: String(spelendRoem),
      tegenRoem: String(tegenRoem),
      roemEntries: encoded,
    })
    router.push(`/games/${gameId}/hand/${n}/score?${params}`)
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title={`Handje ${handNumber} — Roem melden`}
        backHref={`/games/${gameId}/hand/${n}/trump`}
      />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Trump indicator */}
        <div className={`rounded-xl p-3 text-center border ${d.bgClass} ${d.borderClass}`}>
          <p className="text-2xl font-bold">
            <span className={d.textClass}>{d.symbol}</span> {d.name} · Troef
          </p>
          <p className="text-sm text-gray-300 mt-0.5">
            {trumpMakerPlayer?.player?.display_name ?? `Seat ${trumpMakerSeat}`} maakt troef
          </p>
        </div>

        <RoemPanel
          trumpSuit={trumpSuit}
          spelendLabel={spelendPlayers || 'Wij'}
          tegenLabel={tegenPlayers || 'Zij'}
          entries={entries}
          onAdd={addEntry}
          onRemove={removeEntry}
        />

        <button
          onClick={handleContinue}
          className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors text-lg min-h-[56px]"
        >
          Handje klaar →
        </button>
      </main>
    </div>
  )
}

export default function RoemPage({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = use(params)
  return (
    <Suspense>
      <RoemPageContent gameId={id} n={n} />
    </Suspense>
  )
}
