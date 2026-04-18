'use client'

import type { Player } from '@/lib/supabase/types'

interface TableProps {
  players: Player[]
  assignments: Record<number, string> // seat -> playerId
  onAssign: (seat: number, playerId: string) => void
}

const SEAT_POSITIONS = [
  { seat: 1, label: 'Seat 1', position: 'top-0 left-1/2 -translate-x-1/2', team: 'A' },
  { seat: 2, label: 'Seat 2', position: 'right-0 top-1/2 -translate-y-1/2', team: 'B' },
  { seat: 3, label: 'Seat 3', position: 'bottom-0 left-1/2 -translate-x-1/2', team: 'A' },
  { seat: 4, label: 'Seat 4', position: 'left-0 top-1/2 -translate-y-1/2', team: 'B' },
]

export default function Table({ players, assignments, onAssign }: TableProps) {
  const assignedPlayerIds = Object.values(assignments)
  const unassigned = players.filter(p => !assignedPlayerIds.includes(p.id))

  return (
    <div className="space-y-4">
      {/* Visual table */}
      <div className="relative w-full aspect-square max-w-[260px] mx-auto">
        {/* Green felt table */}
        <div className="absolute inset-[20%] bg-green-900 rounded-full border-4 border-green-700 flex items-center justify-center">
          <div className="text-center text-xs text-green-400">
            <p>Team A</p>
            <p className="text-gray-500">vs</p>
            <p>Team B</p>
          </div>
        </div>

        {/* Seats */}
        {SEAT_POSITIONS.map(({ seat, position, team }) => {
          const playerId = assignments[seat]
          const player = players.find(p => p.id === playerId)

          return (
            <div
              key={seat}
              className={`absolute ${position} transform`}
            >
              <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center text-center border-2 text-xs font-medium transition-all ${
                player
                  ? team === 'A'
                    ? 'bg-blue-900 border-blue-500 text-blue-200'
                    : 'bg-orange-900 border-orange-500 text-orange-200'
                  : 'bg-gray-800 border-gray-600 text-gray-500'
              }`}>
                {player ? (
                  <>
                    <span className="font-semibold text-sm">{player.display_name.slice(0, 6)}</span>
                    <span className="text-[10px] opacity-70">S{seat}</span>
                  </>
                ) : (
                  <>
                    <span>S{seat}</span>
                    <span className="text-[10px]">Leeg</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Team legend */}
      <div className="flex gap-4 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-600" />
          <span className="text-gray-400">Team A (S1 & S3)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-600" />
          <span className="text-gray-400">Team B (S2 & S4)</span>
        </div>
      </div>

      {/* Assignment dropdowns */}
      <div className="grid grid-cols-2 gap-3">
        {SEAT_POSITIONS.map(({ seat, team }) => (
          <div key={seat}>
            <label className="block text-xs text-gray-400 mb-1">
              Seat {seat} <span className={`${team === 'A' ? 'text-blue-400' : 'text-orange-400'}`}>(Team {team})</span>
            </label>
            <select
              value={assignments[seat] ?? ''}
              onChange={e => onAssign(seat, e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
            >
              <option value="">— Kies speler —</option>
              {players
                .filter(p => !assignedPlayerIds.includes(p.id) || assignments[seat] === p.id)
                .map(p => (
                  <option key={p.id} value={p.id}>{p.display_name}</option>
                ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
