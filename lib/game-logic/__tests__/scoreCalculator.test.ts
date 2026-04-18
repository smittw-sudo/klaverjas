import { describe, it, expect } from 'vitest'
import { calculateHandResult } from '../scoreCalculator'

const base = {
  kraakMultiplier: 1 as const,
  pit: false,
  verzaakt: false,
  verzaaktBySpeelTeam: false,
}

describe('calculateHandResult', () => {
  it('spelend team wint normaal', () => {
    const result = calculateHandResult({
      ...base,
      spelendTeamKaartpunten: 100,
      spelendTeamRoem: 20,
      tegenTeamRoem: 0,
    })
    expect(result.nat).toBe(false)
    expect(result.spelendTeamEindpunten).toBe(120) // 100+20
    expect(result.tegenTeamEindpunten).toBe(62)   // 62+0
  })

  it('nat bij gelijkstand (82-82)', () => {
    const result = calculateHandResult({
      ...base,
      spelendTeamKaartpunten: 82,
      spelendTeamRoem: 0,
      tegenTeamRoem: 0,
    })
    // spelend: 82+0=82, tegen: 80+0=80 → spelend wint
    expect(result.nat).toBe(false)
  })

  it('nat bij exacte gelijkstand (81-81 incl roem)', () => {
    const result = calculateHandResult({
      ...base,
      spelendTeamKaartpunten: 81,
      spelendTeamRoem: 0,
      tegenTeamRoem: 0,
    })
    // spelend: 81, tegen: 81 → gelijkstand = nat
    expect(result.nat).toBe(true)
    expect(result.spelendTeamEindpunten).toBe(0)
    expect(result.tegenTeamEindpunten).toBe(162)
  })

  it('nat: spelend krijgt 0, tegen krijgt 162 + alle roem', () => {
    const result = calculateHandResult({
      ...base,
      spelendTeamKaartpunten: 70,
      spelendTeamRoem: 20,
      tegenTeamRoem: 40,
    })
    expect(result.nat).toBe(true)
    expect(result.spelendTeamEindpunten).toBe(0)
    expect(result.tegenTeamEindpunten).toBe(162 + 20 + 40) // 222
  })

  it('kraak × 2', () => {
    const result = calculateHandResult({
      ...base,
      kraakMultiplier: 2,
      spelendTeamKaartpunten: 100,
      spelendTeamRoem: 0,
      tegenTeamRoem: 0,
    })
    expect(result.spelendTeamEindpunten).toBe(200)
    expect(result.tegenTeamEindpunten).toBe(124)
  })

  it('kraak × 8 nat', () => {
    const result = calculateHandResult({
      ...base,
      kraakMultiplier: 8,
      spelendTeamKaartpunten: 60,
      spelendTeamRoem: 0,
      tegenTeamRoem: 0,
    })
    expect(result.nat).toBe(true)
    expect(result.tegenTeamEindpunten).toBe(162 * 8)
  })

  it('pit voegt 100 roem toe aan spelend team', () => {
    const result = calculateHandResult({
      ...base,
      pit: true,
      spelendTeamKaartpunten: 162,
      spelendTeamRoem: 0,
      tegenTeamRoem: 0,
    })
    expect(result.nat).toBe(false)
    expect(result.spelendTeamEindpunten).toBe(262) // 162+100
  })

  it('verzaakt door spelend team = directe nat', () => {
    const result = calculateHandResult({
      ...base,
      verzaakt: true,
      verzaaktBySpeelTeam: true,
      spelendTeamKaartpunten: 162,
      spelendTeamRoem: 40,
      tegenTeamRoem: 0,
    })
    expect(result.nat).toBe(true)
    expect(result.spelendTeamEindpunten).toBe(0)
    expect(result.tegenTeamEindpunten).toBe(162 + 40) // 202
  })

  it('verzaakt door tegenpartij = 262 + roem naar spelend', () => {
    const result = calculateHandResult({
      ...base,
      verzaakt: true,
      verzaaktBySpeelTeam: false,
      spelendTeamKaartpunten: 100,
      spelendTeamRoem: 20,
      tegenTeamRoem: 40,
    })
    expect(result.nat).toBe(false)
    expect(result.spelendTeamEindpunten).toBe(262 + 20 + 40) // 322
    expect(result.tegenTeamEindpunten).toBe(0)
  })
})
