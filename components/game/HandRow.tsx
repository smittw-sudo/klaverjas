import type { Hand } from '@/lib/supabase/types'
import { TRUMP_DISPLAY } from '@/lib/utils/trumpDisplay'

interface Props {
  hand: Hand
  handNumber: number
  isActive?: boolean
}

export default function HandRow({ hand, handNumber, isActive = false }: Props) {
  const d = TRUMP_DISPLAY[hand.trump_suit]

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-800 ${isActive ? 'bg-green-950/30' : ''}`}>
      <span className="text-gray-500 text-sm w-5">{handNumber}</span>
      <span className={`text-xl ${d.textClass}`}>{d.symbol}</span>
      <div className="flex-1 flex items-center gap-2">
        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
          hand.nat ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-400'
        }`}>
          {hand.nat ? 'NAT' : `${hand.spelend_team_kaartpunten}`}
        </span>
        {hand.pit && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900 text-yellow-300">PIT</span>
        )}
        {hand.kraak_multiplier > 1 && (
          <span className="text-xs text-orange-400">×{hand.kraak_multiplier}</span>
        )}
      </div>
      <div className="text-right">
        <span className="font-mono text-sm text-blue-300">{hand.team_a_eindpunten}</span>
        <span className="text-gray-600 mx-1">|</span>
        <span className="font-mono text-sm text-orange-300">{hand.team_b_eindpunten}</span>
      </div>
    </div>
  )
}
