import { useState } from 'react'
import type { Player } from '@/lib/supabase/types'

interface TableProps {
  players: Player[]
  assignments: Record<number, string> // seat -> playerId
  onAssign: (seat: number, playerId: string) => void
}

const SEATS = [
  { seat: 1, label: 'Noord', team: 'A' as const },
  { seat: 2, label: 'Oost',  team: 'B' as const },
  { seat: 3, label: 'Zuid',  team: 'A' as const },
  { seat: 4, label: 'West',  team: 'B' as const },
]

export default function Table({ players, assignments, onAssign }: TableProps) {
  const [activeSeat, setActiveSeat] = useState<number | null>(null)

  const assignedIds = new Set(Object.values(assignments).filter(Boolean))
  const unassignedPlayers = players.filter(p => !assignedIds.has(p.id))

  function handleSeatPress(seat: number) {
    if (activeSeat === seat) {
      setActiveSeat(null)
    } else {
      setActiveSeat(seat)
    }
  }

  function handlePlayerPick(playerId: string) {
    if (activeSeat == null) return
    onAssign(activeSeat, playerId)
    // Move to next empty seat automatically
    const nextEmpty = SEATS.find(s => s.seat !== activeSeat && !assignments[s.seat])
    setActiveSeat(nextEmpty?.seat ?? null)
  }

  function handleUnassign(seat: number) {
    onAssign(seat, '')
    setActiveSeat(seat)
  }

  return (
    <div className="space-y-4">
      {/* Team header */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold">
        <div className="py-1.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800">Team A · S1 & S3</div>
        <div className="py-1.5 rounded-lg bg-orange-950 text-orange-300 border border-orange-800">Team B · S2 & S4</div>
      </div>

      {/* 2x2 seat grid */}
      <div className="grid grid-cols-2 gap-3">
        {SEATS.map(({ seat, label, team }) => {
          const playerId = assignments[seat]
          const player = players.find(p => p.id === playerId)
          const isActive = activeSeat === seat
          const teamColor = team === 'A'
            ? isActive
              ? 'border-blue-400 bg-blue-950 ring-2 ring-blue-500'
              : player
                ? 'border-blue-700 bg-blue-950/60'
                : 'border-gray-700 bg-gray-900'
            : isActive
              ? 'border-orange-400 bg-orange-950 ring-2 ring-orange-500'
              : player
                ? 'border-orange-700 bg-orange-950/60'
                : 'border-gray-700 bg-gray-900'

          return (
            <button
              key={seat}
              type="button"
              onClick={() => player ? handleUnassign(seat) : handleSeatPress(seat)}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-4 px-3 transition-all active:scale-95 min-h-[88px] ${teamColor}`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                team === 'A' ? 'text-blue-400' : 'text-orange-400'
              }`}>{label}</span>

              {player ? (
                <>
                  <span className="font-bold text-white text-base leading-tight text-center">{player.display_name}</span>
                  <span className="text-[10px] text-gray-500">Tik om te verwijderen</span>
                </>
              ) : isActive ? (
                <span className="text-sm text-gray-300 font-medium">Kies speler ↓</span>
              ) : (
                <span className="text-sm text-gray-500">Leeg</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Player picker — only visible when a seat is active */}
      {activeSeat !== null && (
        <div className="rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
          <p className="px-4 py-2.5 text-xs font-semibold text-gray-400 border-b border-gray-800 bg-gray-950">
            Kies speler voor {SEATS.find(s => s.seat === activeSeat)?.label}
          </p>
          {unassignedPlayers.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-500 text-center">Alle spelers zijn al ingedeeld.</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {unassignedPlayers.map(player => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handlePlayerPick(player.id)}
                  className="w-full text-left px-4 py-3.5 text-white font-medium hover:bg-gray-800 active:bg-gray-700 transition-colors text-base"
                >
                  {player.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All seats filled → close picker hint */}
      {activeSeat === null && Object.values(assignments).filter(Boolean).length === 4 && (
        <p className="text-center text-xs text-green-400">✓ Alle spelers ingedeeld</p>
      )}
    </div>
  )
}
