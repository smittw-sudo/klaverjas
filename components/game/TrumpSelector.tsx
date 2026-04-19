

import type { TrumpSuit, KraakType } from '@/lib/supabase/types'
import { TRUMP_DISPLAY } from '@/lib/utils/trumpDisplay'

interface TrumpSelectorProps {
  selectedSuit: TrumpSuit | null
  onSelect: (suit: TrumpSuit) => void
  kraakType?: KraakType
  onKraakChange?: (type: KraakType) => void
  showKraak?: boolean
}

const KRAAK_OPTIONS: Array<{ type: KraakType; label: string; multiplier: number }> = [
  { type: 'geen', label: 'Geen kraak', multiplier: 1 },
  { type: 'kraak', label: 'Kraak ×2', multiplier: 2 },
  { type: 'rekraak', label: 'Rekraak ×4', multiplier: 4 },
  { type: 'superkraak', label: 'Superkraak ×8', multiplier: 8 },
]

export default function TrumpSelector({
  selectedSuit,
  onSelect,
  kraakType = 'geen',
  onKraakChange,
  showKraak = false,
}: TrumpSelectorProps) {
  const suits: TrumpSuit[] = ['harten', 'schoppen', 'klaveren', 'ruiten']

  return (
    <div className="space-y-4">
      {/* Troef knoppen */}
      <div className="grid grid-cols-2 gap-3">
        {suits.map(suit => {
          const d = TRUMP_DISPLAY[suit]
          const selected = selectedSuit === suit
          return (
            <button
              key={suit}
              type="button"
              onClick={() => onSelect(suit)}
              className={`flex items-center justify-center gap-3 py-5 rounded-xl border-2 text-xl font-bold transition-all min-h-[72px] ${
                selected
                  ? `${d.bgClass} ${d.borderClass} ${d.textClass} scale-[1.02]`
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <span className={`text-3xl ${selected ? d.textClass : ''}`}>{d.symbol}</span>
              <span className="text-base">{d.name}</span>
            </button>
          )
        })}
      </div>

      {/* Kraak opties */}
      {showKraak && onKraakChange && (
        <div>
          <p className="text-sm text-gray-400 mb-2">Kraak</p>
          <div className="grid grid-cols-2 gap-2">
            {KRAAK_OPTIONS.map(k => (
              <button
                key={k.type}
                type="button"
                onClick={() => onKraakChange(k.type)}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all min-h-[48px] ${
                  kraakType === k.type
                    ? 'bg-yellow-900 border-yellow-500 text-yellow-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
