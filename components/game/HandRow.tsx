import type { Hand } from '@/lib/supabase/types'
import { TRUMP_DISPLAY } from '@/lib/utils/trumpDisplay'

interface Props {
  hand: Hand
  isTeamASpelend: boolean
  teamAKaart: number
  teamBKaart: number
  teamARoem: number
  teamBRoem: number
  cumTeamA: number
  cumTeamB: number
}

export default function HandRow({
  hand,
  isTeamASpelend,
  teamAKaart,
  teamBKaart,
  teamARoem,
  teamBRoem,
  cumTeamA,
  cumTeamB,
}: Props) {
  const d = TRUMP_DISPLAY[hand.trump_suit]

  return (
    <div className="border-b border-gray-800 last:border-0">
      {/* Hoofdrij: troef + badges + kaartpunten + running total */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* # en troef */}
        <span className="text-gray-500 text-xs w-4 shrink-0">{hand.hand_number}</span>
        <span className={`text-lg shrink-0 ${d.textClass}`}>{d.symbol}</span>

        {/* Badges */}
        <div className="flex gap-1 shrink-0">
          {hand.nat && <span className="text-xs px-1.5 py-0.5 rounded bg-red-900 text-red-300 font-semibold">NAT</span>}
          {hand.pit && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900 text-yellow-300 font-semibold">PIT</span>}
          {hand.verzaakt && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-900 text-orange-300 font-semibold">VRZ</span>}
          {hand.kraak_multiplier > 1 && <span className="text-xs text-yellow-400 font-semibold">×{hand.kraak_multiplier}</span>}
        </div>

        {/* Kaartpunten wij / zij */}
        <div className="flex-1 flex items-center justify-center gap-1 text-sm font-mono">
          {hand.nat ? (
            <span className="text-gray-600 text-xs">—</span>
          ) : (
            <>
              <span className={isTeamASpelend ? 'text-blue-300 font-semibold' : 'text-blue-400'}>
                {teamAKaart}
              </span>
              <span className="text-gray-600 text-xs">/</span>
              <span className={!isTeamASpelend ? 'text-orange-300 font-semibold' : 'text-orange-400'}>
                {teamBKaart}
              </span>
            </>
          )}
        </div>

        {/* Lopend totaal eindpunten */}
        <div className="flex items-center gap-1 text-xs font-mono shrink-0">
          <span className="text-blue-400">{cumTeamA}</span>
          <span className="text-gray-600">|</span>
          <span className="text-orange-400">{cumTeamB}</span>
        </div>
      </div>

      {/* Roem-rij (alleen als er roem is) */}
      {(teamARoem > 0 || teamBRoem > 0) && !hand.verzaakt && (
        <div className="flex items-center gap-2 px-3 pb-2 -mt-1">
          <span className="w-4 shrink-0" />
          <span className="text-lg shrink-0 opacity-0">·</span>
          <span className="text-xs text-gray-500 flex-1">
            roem:{' '}
            {teamARoem > 0 && <span className="text-blue-400">+{teamARoem}</span>}
            {teamARoem > 0 && teamBRoem > 0 && <span className="text-gray-600"> / </span>}
            {teamBRoem > 0 && <span className="text-orange-400">+{teamBRoem}</span>}
          </span>
        </div>
      )}
    </div>
  )
}
