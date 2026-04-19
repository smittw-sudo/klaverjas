import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TrumpSelector from '@/components/game/TrumpSelector'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/client'
import { getDealerSeat, getTrumpMakerSeat, TRUMP_DISPLAY } from '@/lib/utils/trumpDisplay'
import type { TrumpSuit, KraakType, GameVariant } from '@/lib/supabase/types'

export default function TrumpScreen() {
  const { gameId, n } = useParams<{ gameId: string; n: string }>()
  const navigate = useNavigate()
  const handNumber = parseInt(n!)

  const [gamePlayers, setGamePlayers] = useState<Array<{ seat_position: number; player: { display_name: string } }>>([])
  const [gameVariant, setGameVariant] = useState<GameVariant>('amsterdams')
  const [selectedSuit, setSelectedSuit] = useState<TrumpSuit | null>(null)
  const [kraakType, setKraakType] = useState<KraakType>('geen')

  const dealerSeat = getDealerSeat(handNumber)
  const trumpMakerSeat = getTrumpMakerSeat(dealerSeat)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('game_players')
      .select('seat_position, player:players(display_name)')
      .eq('game_id', gameId!)
      .then(({ data }) => {
        if (data) setGamePlayers(data as unknown as typeof gamePlayers)
      })
    supabase
      .from('games')
      .select('variant')
      .eq('id', gameId!)
      .single()
      .then(({ data }) => {
        if (data) setGameVariant(data.variant as GameVariant)
      })
  }, [gameId])

  const dealerPlayer = gamePlayers.find(gp => gp.seat_position === dealerSeat)
  const trumpMakerPlayer = gamePlayers.find(gp => gp.seat_position === trumpMakerSeat)
  const isKraakVariant = gameVariant.startsWith('kraken')

  function handleContinue() {
    if (!selectedSuit) return
    const params = new URLSearchParams({
      suit: selectedSuit,
      kraak: kraakType,
      dealer: String(dealerSeat),
      trumpMaker: String(trumpMakerSeat),
    })
    navigate(`/games/${gameId}/hand/${n}/roem?${params}`)
  }

  return (
    <div className="min-h-screen">
      <PageHeader title={`Handje ${handNumber} — Troef kiezen`} backHref={`/games/${gameId}`} />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-sm space-y-1">
          <p className="text-gray-400">
            Deler: <span className="text-white font-semibold">{dealerPlayer?.player?.display_name ?? `Seat ${dealerSeat}`}</span>
          </p>
          <p className="text-gray-400">
            Troef maken: <span className="text-green-400 font-semibold">{trumpMakerPlayer?.player?.display_name ?? `Seat ${trumpMakerSeat}`}</span>
          </p>
        </div>

        <TrumpSelector
          selectedSuit={selectedSuit}
          onSelect={setSelectedSuit}
          kraakType={kraakType}
          onKraakChange={setKraakType}
          showKraak={isKraakVariant}
        />

        {selectedSuit && (
          <div className={`rounded-xl p-3 text-center border ${TRUMP_DISPLAY[selectedSuit].bgClass} ${TRUMP_DISPLAY[selectedSuit].borderClass}`}>
            <span className={`text-2xl ${TRUMP_DISPLAY[selectedSuit].textClass}`}>
              {TRUMP_DISPLAY[selectedSuit].symbol} {TRUMP_DISPLAY[selectedSuit].name} is troef
            </span>
            {kraakType !== 'geen' && (
              <p className="text-yellow-400 text-sm mt-1">
                {kraakType === 'kraak' ? '×2' : kraakType === 'rekraak' ? '×4' : '×8'} kraak
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!selectedSuit}
          className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-lg min-h-[56px]"
        >
          Spelen →
        </button>
      </main>
    </div>
  )
}
