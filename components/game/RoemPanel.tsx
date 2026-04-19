

import type { RoemType } from '@/lib/supabase/types'
import { ROEM_VALUES, ROEM_LABELS, TRUMP_DISPLAY } from '@/lib/utils/trumpDisplay'
import type { TrumpSuit } from '@/lib/supabase/types'

export interface RoemEntry {
  type: RoemType
  team: 'spelend' | 'tegen'
  punten: number
}

interface Props {
  trumpSuit: TrumpSuit
  spelendLabel: string
  tegenLabel: string
  entries: RoemEntry[]
  onAdd: (entry: RoemEntry) => void
  onRemove: (index: number) => void
}

const ROEM_BUTTONS: RoemType[] = ['stuk', 'drie_op_rij', 'vier_op_rij', 'vijf_plus', 'vier_boeren', 'vier_tienen', 'vier_azen']

export default function RoemPanel({ trumpSuit, spelendLabel, tegenLabel, entries, onAdd, onRemove }: Props) {
  const d = TRUMP_DISPLAY[trumpSuit]
  const [selectedTeam, setSelectedTeam] = React.useState<'spelend' | 'tegen'>('spelend')

  const spelendTotal = entries.filter(e => e.team === 'spelend').reduce((s, e) => s + e.punten, 0)
  const tegenTotal = entries.filter(e => e.team === 'tegen').reduce((s, e) => s + e.punten, 0)

  return (
    <div className="space-y-4">
      {/* Team toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSelectedTeam('spelend')}
          className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all min-h-[52px] ${
            selectedTeam === 'spelend'
              ? 'bg-blue-800 border-2 border-blue-500 text-blue-200'
              : 'bg-gray-800 border-2 border-gray-700 text-gray-400'
          }`}
        >
          {spelendLabel}
          {spelendTotal > 0 && <span className="ml-1 text-blue-300">+{spelendTotal}</span>}
        </button>
        <button
          type="button"
          onClick={() => setSelectedTeam('tegen')}
          className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all min-h-[52px] ${
            selectedTeam === 'tegen'
              ? 'bg-orange-800 border-2 border-orange-500 text-orange-200'
              : 'bg-gray-800 border-2 border-gray-700 text-gray-400'
          }`}
        >
          {tegenLabel}
          {tegenTotal > 0 && <span className="ml-1 text-orange-300">+{tegenTotal}</span>}
        </button>
      </div>

      {/* Roem buttons */}
      <div className="grid grid-cols-2 gap-2">
        {ROEM_BUTTONS.map(type => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd({ type, team: selectedTeam, punten: ROEM_VALUES[type] })}
            className="py-4 px-3 bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-700 rounded-xl text-sm font-semibold transition-all min-h-[60px] flex flex-col items-center gap-0.5"
          >
            <span>{ROEM_LABELS[type]}</span>
            <span className="text-green-400 font-bold">+{ROEM_VALUES[type]}</span>
          </button>
        ))}
      </div>

      {/* Current entries */}
      {entries.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
          <p className="text-xs text-gray-500 mb-2">Gemelde roem:</p>
          <div className="space-y-1">
            {entries.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={entry.team === 'spelend' ? 'text-blue-400' : 'text-orange-400'}>
                    {entry.team === 'spelend' ? spelendLabel : tegenLabel}
                  </span>
                  <span className="text-gray-400">{ROEM_LABELS[entry.type]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-mono">+{entry.punten}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="text-gray-600 hover:text-red-400 text-lg leading-none w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-800 flex justify-between text-xs">
            <span className="text-gray-500">Totaal:</span>
            <div className="flex gap-4">
              <span className="text-blue-400">{spelendLabel}: {spelendTotal}</span>
              <span className="text-orange-400">{tegenLabel}: {tegenTotal}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Need React import for useState
import React from 'react'
