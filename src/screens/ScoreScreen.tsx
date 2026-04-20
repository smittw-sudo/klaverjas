import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ScoreInput from '@/components/game/ScoreInput'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/client'
import { calculateHandResult } from '@/lib/game-logic/scoreCalculator'
import { TRUMP_DISPLAY } from '@/lib/utils/trumpDisplay'
import type { TrumpSuit, KraakType, KraakMultiplier } from '@/lib/supabase/types'
import type { RoemEntry } from '@/components/game/RoemPanel'

export default function ScoreScreen() {
  const { gameId, n } = useParams<{ gameId: string; n: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const handNumber = parseInt(n!)

  const trumpSuit = searchParams.get('suit') as TrumpSuit
  const kraakTypeStr = (searchParams.get('kraak') ?? 'geen') as KraakType
  const dealerSeat = parseInt(searchParams.get('dealer') ?? '1')
  const trumpMakerSeat = parseInt(searchParams.get('trumpMaker') ?? '2')
  const spelendRoem = parseInt(searchParams.get('spelendRoem') ?? '0')
  const tegenRoem = parseInt(searchParams.get('tegenRoem') ?? '0')
  const roemEntriesRaw = searchParams.get('roemEntries')
  const roemEntries: RoemEntry[] = roemEntriesRaw ? JSON.parse(decodeURIComponent(roemEntriesRaw)) : []

  const kraakMultiplierMap: Record<KraakType, KraakMultiplier> = {
    geen: 1, kraak: 2, rekraak: 4, superkraak: 8
  }
  const kraakMultiplier = kraakMultiplierMap[kraakTypeStr]

  const [gamePlayers, setGamePlayers] = useState<Array<{ seat_position: number; player: { display_name: string } }>>([])
  const [kaartpunten, setKaartpunten] = useState(82)
  const [nat, setNat] = useState(false)
  const [pit, setPit] = useState(false)
  const [verzaakt, setVerzaakt] = useState(false)
  const [verzaaktBySpeelTeam, setVerzaaktBySpeelTeam] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('game_players')
      .select('seat_position, player:players(display_name)')
      .eq('game_id', gameId!)
      .then(({ data }) => {
        if (data) setGamePlayers(data as unknown as typeof gamePlayers)
      })
  }, [gameId])

  if (!trumpSuit) return <div className="p-4 text-red-400">Ongeldige params</div>

  const isTeamA = (seat: number) => seat === 1 || seat === 3
  const spelendIsTeamA = isTeamA(trumpMakerSeat)

  const spelendPlayers = gamePlayers
    .filter(gp => isTeamA(gp.seat_position) === spelendIsTeamA)
    .map(gp => gp.player?.display_name).join(' & ')
  const tegenPlayers = gamePlayers
    .filter(gp => isTeamA(gp.seat_position) !== spelendIsTeamA)
    .map(gp => gp.player?.display_name).join(' & ')

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const result = calculateHandResult({
        spelendTeamKaartpunten: kaartpunten,
        spelendTeamRoem: spelendRoem,
        tegenTeamRoem: tegenRoem,
        kraakMultiplier,
        pit,
        forcedNat: nat,
        verzaakt,
        verzaaktBySpeelTeam,
      })
      const teamAEindpunten = spelendIsTeamA ? result.spelendTeamEindpunten : result.tegenTeamEindpunten
      const teamBEindpunten = spelendIsTeamA ? result.tegenTeamEindpunten : result.spelendTeamEindpunten

      const { data: hand, error: handErr } = await supabase
        .from('hands')
        .upsert({
          game_id: gameId!,
          hand_number: handNumber,
          dealer_seat: dealerSeat,
          trump_maker_seat: trumpMakerSeat,
          trump_suit: trumpSuit,
          kraak_type: kraakTypeStr,
          kraak_multiplier: kraakMultiplier,
          spelend_team_kaartpunten: result.effectiveKaartpunten,
          spelend_team_seat: trumpMakerSeat,
          spelend_team_roem: spelendRoem,
          tegen_team_roem: tegenRoem,
          spelend_team_roem_afgekeurd: false,
          nat: result.nat,
          pit,
          verzaakt,
          verzaakt_seat: null,
          team_a_eindpunten: teamAEindpunten,
          team_b_eindpunten: teamBEindpunten,
        }, { onConflict: 'game_id,hand_number' })
        .select()
        .single()

      if (handErr) throw handErr

      await supabase.from('roem_entries').delete().eq('hand_id', hand.id)
      if (roemEntries.length > 0) {
        await supabase.from('roem_entries').insert(
          roemEntries.map(e => ({
            hand_id: hand.id,
            team: e.team,
            roem_type: e.type,
            punten: e.punten,
            afgekeurd: false,
          }))
        )
      }

      if (handNumber >= 16) {
        await supabase.from('games').update({ status: 'completed' }).eq('id', gameId!)
      }

      navigate(`/games/${gameId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt')
      setSaving(false)
    }
  }

  const d = TRUMP_DISPLAY[trumpSuit]

  return (
    <div className="min-h-screen">
      <PageHeader
        title={`Score handje ${handNumber}`}
        backHref={`/games/${gameId}/hand/${n}/roem?suit=${trumpSuit}&kraak=${kraakTypeStr}&dealer=${dealerSeat}&trumpMaker=${trumpMakerSeat}`}
      />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-4 pb-24">
        <div className={`rounded-xl p-3 text-center border ${d.bgClass} ${d.borderClass}`}>
          <p className="text-xl font-bold">
            <span className={d.textClass}>{d.symbol}</span> {d.name} ·{' '}
            {gamePlayers.find(gp => gp.seat_position === trumpMakerSeat)?.player?.display_name ?? `Seat ${trumpMakerSeat}`} maakt troef
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-3 text-sm">{error}</div>
        )}

        <ScoreInput
          trumpSuit={trumpSuit}
          spelendLabel={spelendPlayers || 'Wij'}
          tegenLabel={tegenPlayers || 'Zij'}
          spelendRoem={spelendRoem}
          tegenRoem={tegenRoem}
          roemEntries={roemEntries}
          kraakMultiplier={kraakMultiplier}
          kaartpunten={kaartpunten}
          onKaartpuntenChange={setKaartpunten}
          nat={nat}
          onNatChange={setNat}
          pit={pit}
          onPitChange={setPit}
          verzaakt={verzaakt}
          onVerzaaktChange={setVerzaakt}
          verzaaktBySpeelTeam={verzaaktBySpeelTeam}
          onVerzaaktBySpeelTeamChange={setVerzaaktBySpeelTeam}
        />
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-950 border-t border-gray-800">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors min-h-[52px]"
          >
            ← Terug
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors min-h-[52px]"
          >
            {saving ? 'Opslaan…' : 'Opslaan ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}
