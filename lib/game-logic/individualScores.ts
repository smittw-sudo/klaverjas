import type { HandResult } from './scoreCalculator'
import type { SeatPosition } from '@/lib/supabase/types'

export function distributeIndividualScores(
  handResult: HandResult,
  spelendTeamSeat: SeatPosition
): Record<SeatPosition, number> {
  // Team A = seats 1&3, Team B = seats 2&4
  const spelendIsTeamA = spelendTeamSeat === 1 || spelendTeamSeat === 3

  const teamAScore = spelendIsTeamA
    ? handResult.spelendTeamEindpunten
    : handResult.tegenTeamEindpunten

  const teamBScore = spelendIsTeamA
    ? handResult.tegenTeamEindpunten
    : handResult.spelendTeamEindpunten

  return {
    1: Math.round(teamAScore / 2),
    2: Math.round(teamBScore / 2),
    3: Math.round(teamAScore / 2),
    4: Math.round(teamBScore / 2),
  }
}
