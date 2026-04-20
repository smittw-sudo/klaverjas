
import type { TrumpSuit } from '@/lib/supabase/types'
import { TRUMP_DISPLAY, ROEM_LABELS } from '@/lib/utils/trumpDisplay'
import { calculateHandResult, isNatWarning } from '@/lib/game-logic/scoreCalculator'
import type { RoemEntry } from './RoemPanel'

interface Props {
  trumpSuit: TrumpSuit
  spelendLabel: string
  tegenLabel: string
  spelendRoem: number
  tegenRoem: number
  roemEntries: RoemEntry[]
  kraakMultiplier: 1 | 2 | 4 | 8
  kaartpunten: number
  onKaartpuntenChange: (v: number) => void
  nat: boolean
  onNatChange: (v: boolean) => void
  pit: boolean
  onPitChange: (v: boolean) => void
  verzaakt: boolean
  onVerzaaktChange: (v: boolean) => void
  verzaaktBySpeelTeam: boolean
  onVerzaaktBySpeelTeamChange: (v: boolean) => void
}

export default function ScoreInput({
  trumpSuit, spelendLabel, tegenLabel,
  spelendRoem, tegenRoem, roemEntries, kraakMultiplier,
  kaartpunten, onKaartpuntenChange,
  nat, onNatChange,
  pit, onPitChange,
  verzaakt, onVerzaaktChange,
  verzaaktBySpeelTeam, onVerzaaktBySpeelTeamChange,
}: Props) {
  const d = TRUMP_DISPLAY[trumpSuit]

  // PIT of NAT: kaartpunten invoer is niet relevant
  const scoreDisabled = pit || nat || verzaakt
  const effectiveKaartpunten = pit ? 162 : kaartpunten
  const tegenKaartpunten = 162 - effectiveKaartpunten

  const totalSpelendRoem = spelendRoem + (pit ? 100 : 0)
  const autoNat = !pit && !nat && !verzaakt && isNatWarning(kaartpunten, totalSpelendRoem, tegenRoem)

  const preview = calculateHandResult({
    spelendTeamKaartpunten: effectiveKaartpunten,
    spelendTeamRoem: spelendRoem,
    tegenTeamRoem: tegenRoem,
    kraakMultiplier,
    pit,
    forcedNat: nat,
    verzaakt,
    verzaaktBySpeelTeam,
  })

  function adjust(delta: number) {
    const newVal = Math.max(0, Math.min(162, kaartpunten + delta))
    onKaartpuntenChange(newVal)
  }

  return (
    <div className="space-y-5">
      {/* Kaartpunten invoer */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Kaartpunten <span className="text-blue-400">{spelendLabel}</span>
          {pit && <span className="ml-2 text-yellow-400 text-xs">(PIT = 162 automatisch)</span>}
          {nat && !pit && <span className="ml-2 text-red-400 text-xs">(NAT = score irrelevant)</span>}
          {verzaakt && <span className="ml-2 text-orange-400 text-xs">(Verzaakt = score irrelevant)</span>}
        </label>

        <div className={`flex items-center gap-3 ${scoreDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
          <button
            type="button"
            onClick={() => adjust(-1)}
            className="w-14 h-14 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-xl text-2xl font-bold transition-all border border-gray-700"
          >
            −
          </button>
          <div className="flex-1 h-14 flex items-center justify-center text-2xl font-bold bg-gray-800 border border-gray-700 rounded-xl text-white">
            {pit ? '162' : kaartpunten}
          </div>
          <button
            type="button"
            onClick={() => adjust(1)}
            className="w-14 h-14 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-xl text-2xl font-bold transition-all border border-gray-700"
          >
            +
          </button>
        </div>

        {!scoreDisabled && (
          <>
            <div className="flex gap-3 mt-2">
              {[70, 82, 100, 120, 140, 162].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onKaartpuntenChange(v)}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                    kaartpunten === v ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <span className="text-orange-400">{tegenLabel}</span>: {tegenKaartpunten} kaartpunten
            </p>
          </>
        )}
      </div>

      {/* Auto-NAT waarschuwing */}
      {autoNat && (
        <div className="bg-red-900/50 border border-red-700 rounded-xl p-3 text-sm text-red-300">
          ⚠️ Spelend team haalt te weinig — dit wordt waarschijnlijk NAT
        </div>
      )}

      {/* Roem samenvatting */}
      {roemEntries.length > 0 && (
        <div className={`bg-gray-900 rounded-xl p-3 border ${verzaakt ? 'border-orange-800 opacity-60' : 'border-gray-800'}`}>
          <p className="text-xs text-gray-500 mb-2">
            Roem (stap 2){verzaakt ? ' — telt NIET mee bij verzaking' : ''}:
          </p>
          {roemEntries.map((e, i) => (
            <div key={i} className={`flex justify-between text-xs py-0.5 ${verzaakt ? 'line-through text-gray-600' : ''}`}>
              <span className={e.team === 'spelend' ? 'text-blue-400' : 'text-orange-400'}>
                {e.team === 'spelend' ? spelendLabel : tegenLabel} — {ROEM_LABELS[e.type]}
              </span>
              <span className="text-green-400">+{e.punten}</span>
            </div>
          ))}
          {!verzaakt && (
            <div className="mt-1 pt-1 border-t border-gray-800 flex justify-between text-xs text-gray-400">
              <span>Totaal roem:</span>
              <span>{spelendLabel}: {totalSpelendRoem} | {tegenLabel}: {tegenRoem}</span>
            </div>
          )}
        </div>
      )}

      {/* Vlaggen */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer py-3 px-4 bg-gray-900 rounded-xl border border-gray-800">
          <input
            type="checkbox"
            checked={nat}
            onChange={e => { onNatChange(e.target.checked); if (e.target.checked) { onPitChange(false); onVerzaaktChange(false) } }}
            className="w-5 h-5"
          />
          <div>
            <span className="font-semibold text-red-400">NAT</span>
            <span className="text-sm text-gray-400 ml-2">Spelend ging nat — score irrelevant, roem telt</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer py-3 px-4 bg-gray-900 rounded-xl border border-gray-800">
          <input
            type="checkbox"
            checked={pit}
            onChange={e => { onPitChange(e.target.checked); if (e.target.checked) { onNatChange(false); onVerzaaktChange(false) } }}
            className="w-5 h-5"
          />
          <div>
            <span className="font-semibold text-yellow-400">PIT</span>
            <span className="text-sm text-gray-400 ml-2">Alle 8 slagen → 162 krt + 100 roem, score negeren</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer py-3 px-4 bg-gray-900 rounded-xl border border-gray-800">
          <input
            type="checkbox"
            checked={verzaakt}
            onChange={e => { onVerzaaktChange(e.target.checked); if (e.target.checked) { onNatChange(false); onPitChange(false) } }}
            className="w-5 h-5"
          />
          <div>
            <span className="font-semibold text-orange-400">Verzaakt</span>
            <span className="text-sm text-gray-400 ml-2">Score én roem tellen niet mee</span>
          </div>
        </label>

        {verzaakt && (
          <div className="ml-4 pl-4 border-l-2 border-orange-700">
            <p className="text-sm text-gray-400 mb-2">Wie heeft verzaakt?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onVerzaaktBySpeelTeamChange(true)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  verzaaktBySpeelTeam ? 'bg-blue-800 border-2 border-blue-500 text-blue-200' : 'bg-gray-800 border border-gray-700 text-gray-400'
                }`}
              >
                {spelendLabel}
              </button>
              <button
                type="button"
                onClick={() => onVerzaaktBySpeelTeamChange(false)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  !verzaaktBySpeelTeam ? 'bg-orange-800 border-2 border-orange-500 text-orange-200' : 'bg-gray-800 border border-gray-700 text-gray-400'
                }`}
              >
                {tegenLabel}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-xs text-gray-500 mb-3">Preview eindpunten:</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-400">{spelendLabel}</span>
            <div className="text-right">
              <span className="font-mono font-bold text-lg">
                {preview.nat ? <span className="text-red-400">0 (NAT)</span> : preview.spelendTeamEindpunten}
              </span>
              {!preview.nat && (
                <span className="text-xs text-gray-500 ml-1">= {Math.round(preview.spelendTeamEindpunten / 2)}/pp</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-orange-400">{tegenLabel}</span>
            <div className="text-right">
              <span className="font-mono font-bold text-lg">{preview.tegenTeamEindpunten}</span>
              <span className="text-xs text-gray-500 ml-1">= {Math.round(preview.tegenTeamEindpunten / 2)}/pp</span>
            </div>
          </div>
        </div>
        {kraakMultiplier > 1 && (
          <p className="text-xs text-yellow-400 mt-2">× {kraakMultiplier} kraak</p>
        )}
      </div>
    </div>
  )
}
