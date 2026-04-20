import type { TrumpSuit, KraakType } from '@/lib/supabase/types'
import { TRUMP_DISPLAY } from '@/lib/utils/trumpDisplay'

interface TrumpSelectorProps {
  selectedSuit: TrumpSuit | null
  onSelect: (suit: TrumpSuit) => void
  kraakType?: KraakType
  onKraakChange?: (type: KraakType) => void
  showKraak?: boolean
}

const KRAAK_OPTIONS: Array<{ type: KraakType; label: string }> = [
  { type: 'geen',       label: 'Geen' },
  { type: 'kraak',      label: 'Kraak ×2' },
  { type: 'rekraak',    label: 'Rekraak ×4' },
  { type: 'superkraak', label: 'Superkraak ×8' },
]

// Full-bleed background colours per suit (selected state)
const SUIT_SELECTED: Record<TrumpSuit, string> = {
  harten:   'bg-red-600   border-red-400   text-white',
  schoppen: 'bg-slate-600 border-slate-400 text-white',
  klaveren: 'bg-emerald-600 border-emerald-400 text-white',
  ruiten:   'bg-orange-500 border-orange-300 text-white',
}

const SUIT_IDLE: Record<TrumpSuit, string> = {
  harten:   'bg-red-950/40   border-red-900   text-red-300   hover:bg-red-950/70',
  schoppen: 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700/60',
  klaveren: 'bg-emerald-950/40 border-emerald-900 text-emerald-300 hover:bg-emerald-950/70',
  ruiten:   'bg-orange-950/40 border-orange-900 text-orange-300 hover:bg-orange-950/70',
}

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
      {/* Troef knoppen — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {suits.map(suit => {
          const d = TRUMP_DISPLAY[suit]
          const selected = selectedSuit === suit
          return (
            <button
              key={suit}
              type="button"
              onClick={() => onSelect(suit)}
              className={`flex flex-col items-center justify-center gap-1.5 py-6 rounded-2xl border-2 transition-all active:scale-95 min-h-[100px] ${
                selected ? SUIT_SELECTED[suit] + ' shadow-lg scale-[1.02]' : SUIT_IDLE[suit]
              }`}
            >
              <span className="text-5xl leading-none">{d.symbol}</span>
              <span className={`text-sm font-semibold tracking-wide ${selected ? 'text-white' : ''}`}>{d.name}</span>
            </button>
          )
        })}
      </div>

      {/* Kraak opties */}
      {showKraak && onKraakChange && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Kraak</p>
          <div className="grid grid-cols-2 gap-2">
            {KRAAK_OPTIONS.map(k => (
              <button
                key={k.type}
                type="button"
                onClick={() => onKraakChange(k.type)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all active:scale-95 min-h-[48px] ${
                  kraakType === k.type
                    ? 'bg-yellow-500 border-yellow-400 text-gray-900 font-bold'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
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
