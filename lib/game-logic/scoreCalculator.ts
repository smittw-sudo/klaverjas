import type { KraakMultiplier } from '@/lib/supabase/types'

export interface HandInput {
  spelendTeamKaartpunten: number
  spelendTeamRoem: number
  tegenTeamRoem: number
  kraakMultiplier: KraakMultiplier
  pit: boolean
  forcedNat?: boolean   // manual NAT override — kaartpunten irrelevant, roem telt wel
  verzaakt: boolean
  verzaaktBySpeelTeam: boolean
}

export interface HandResult {
  nat: boolean
  spelendTeamEindpunten: number
  tegenTeamEindpunten: number
  /** Werkelijk gebruikte kaartpunten (162 bij PIT, 0 bij NAT/Verzaakt door spelend) */
  effectiveKaartpunten: number
}

export function calculateHandResult(input: HandInput): HandResult {
  const {
    spelendTeamRoem: spelendRoemRaw,
    tegenTeamRoem,
    kraakMultiplier,
    pit,
    forcedNat = false,
    verzaakt,
    verzaaktBySpeelTeam,
  } = input

  // PIT: spelend team wint alle 8 slagen → kaartpunten = 162, +100 roem
  const effectiveKaartpunten = pit ? 162 : input.spelendTeamKaartpunten
  const spelendTeamRoem = spelendRoemRaw + (pit ? 100 : 0)

  // Verzaakt: roem telt NIET mee voor beide teams
  if (verzaakt && verzaaktBySpeelTeam) {
    return {
      nat: true,
      spelendTeamEindpunten: 0,
      tegenTeamEindpunten: 162 * kraakMultiplier,
      effectiveKaartpunten: 0,
    }
  }
  if (verzaakt && !verzaaktBySpeelTeam) {
    return {
      nat: false,
      spelendTeamEindpunten: 262 * kraakMultiplier,
      tegenTeamEindpunten: 0,
      effectiveKaartpunten: 162,
    }
  }

  // Forced NAT (manual): roem telt wel, kaartpunten irrelevant
  if (forcedNat) {
    const totalRoem = spelendTeamRoem + tegenTeamRoem
    return {
      nat: true,
      spelendTeamEindpunten: 0,
      tegenTeamEindpunten: (162 + totalRoem) * kraakMultiplier,
      effectiveKaartpunten: 0,
    }
  }

  const tegenKaartpunten = 162 - effectiveKaartpunten
  const spelendTotaal = effectiveKaartpunten + spelendTeamRoem
  const tegenTotaal = tegenKaartpunten + tegenTeamRoem

  // Nat: spelend ≤ tegen (inclusief gelijkstand)
  const nat = spelendTotaal <= tegenTotaal

  if (nat) {
    const totalRoem = spelendTeamRoem + tegenTeamRoem
    return {
      nat: true,
      spelendTeamEindpunten: 0,
      tegenTeamEindpunten: (162 + totalRoem) * kraakMultiplier,
      effectiveKaartpunten: 0,
    }
  }

  return {
    nat: false,
    spelendTeamEindpunten: spelendTotaal * kraakMultiplier,
    tegenTeamEindpunten: tegenTotaal * kraakMultiplier,
    effectiveKaartpunten,
  }
}

export function isNatWarning(spelendKaartpunten: number, spelendRoem: number, tegenRoem: number): boolean {
  const tegenKaartpunten = 162 - spelendKaartpunten
  return (spelendKaartpunten + spelendRoem) <= (tegenKaartpunten + tegenRoem)
}
