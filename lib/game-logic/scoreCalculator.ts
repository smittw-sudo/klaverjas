import type { KraakMultiplier } from '@/lib/supabase/types'

export interface HandInput {
  spelendTeamKaartpunten: number
  spelendTeamRoem: number
  tegenTeamRoem: number
  kraakMultiplier: KraakMultiplier
  pit: boolean
  verzaakt: boolean
  verzaaktBySpeelTeam: boolean
}

export interface HandResult {
  nat: boolean
  spelendTeamEindpunten: number
  tegenTeamEindpunten: number
}

export function calculateHandResult(input: HandInput): HandResult {
  const {
    spelendTeamKaartpunten,
    spelendTeamRoem: spelendRoemRaw,
    tegenTeamRoem,
    kraakMultiplier,
    pit,
    verzaakt,
    verzaaktBySpeelTeam,
  } = input

  const tegenKaartpunten = 162 - spelendTeamKaartpunten
  const spelendTeamRoem = spelendRoemRaw + (pit ? 100 : 0)

  // Verzaakt door spelend team → directe nat
  if (verzaakt && verzaaktBySpeelTeam) {
    const totalRoem = spelendTeamRoem + tegenTeamRoem
    return {
      nat: true,
      spelendTeamEindpunten: 0,
      tegenTeamEindpunten: (162 + totalRoem) * kraakMultiplier,
    }
  }

  // Verzaakt door tegenpartij → 262 × multiplier + alle roem → spelend
  if (verzaakt && !verzaaktBySpeelTeam) {
    const totalRoem = spelendTeamRoem + tegenTeamRoem
    return {
      nat: false,
      spelendTeamEindpunten: (262 + totalRoem) * kraakMultiplier,
      tegenTeamEindpunten: 0,
    }
  }

  const spelendTotaal = spelendTeamKaartpunten + spelendTeamRoem
  const tegenTotaal = tegenKaartpunten + tegenTeamRoem

  // Nat: spelend ≤ tegen (inclusief gelijkstand)
  const nat = spelendTotaal <= tegenTotaal

  if (nat) {
    const totalRoem = spelendTeamRoem + tegenTeamRoem
    return {
      nat: true,
      spelendTeamEindpunten: 0,
      tegenTeamEindpunten: (162 + totalRoem) * kraakMultiplier,
    }
  }

  return {
    nat: false,
    spelendTeamEindpunten: spelendTotaal * kraakMultiplier,
    tegenTeamEindpunten: tegenTotaal * kraakMultiplier,
  }
}

export function isNatWarning(spelendKaartpunten: number, spelendRoem: number, tegenRoem: number): boolean {
  const tegenKaartpunten = 162 - spelendKaartpunten
  return (spelendKaartpunten + spelendRoem) <= (tegenKaartpunten + tegenRoem)
}
