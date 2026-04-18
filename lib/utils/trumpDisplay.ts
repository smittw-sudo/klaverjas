import type { TrumpSuit } from '@/lib/supabase/types'

export interface TrumpDisplay {
  symbol: string
  name: string
  color: string
  bgClass: string
  borderClass: string
  textClass: string
  accentClass: string
}

export const TRUMP_DISPLAY: Record<TrumpSuit, TrumpDisplay> = {
  harten: {
    symbol: '♥',
    name: 'Harten',
    color: 'red',
    bgClass: 'bg-red-950',
    borderClass: 'border-red-500',
    textClass: 'text-red-400',
    accentClass: 'bg-red-600 hover:bg-red-500',
  },
  schoppen: {
    symbol: '♠',
    name: 'Schoppen',
    color: 'slate',
    bgClass: 'bg-slate-900',
    borderClass: 'border-slate-500',
    textClass: 'text-slate-300',
    accentClass: 'bg-slate-600 hover:bg-slate-500',
  },
  klaveren: {
    symbol: '♣',
    name: 'Klaveren',
    color: 'green',
    bgClass: 'bg-green-950',
    borderClass: 'border-green-500',
    textClass: 'text-green-400',
    accentClass: 'bg-green-600 hover:bg-green-500',
  },
  ruiten: {
    symbol: '♦',
    name: 'Ruiten',
    color: 'orange',
    bgClass: 'bg-orange-950',
    borderClass: 'border-orange-500',
    textClass: 'text-orange-400',
    accentClass: 'bg-orange-600 hover:bg-orange-500',
  },
}

export const ROEM_VALUES = {
  stuk: 20,
  drie_op_rij: 20,
  vier_op_rij: 50,
  vijf_plus: 50,
  vier_boeren: 200,
  vier_tienen: 100,
  vier_azen: 100,
  pit: 100,
} as const

export const ROEM_LABELS = {
  stuk: 'Stuk',
  drie_op_rij: '3 op rij',
  vier_op_rij: '4 op rij',
  vijf_plus: '5+',
  vier_boeren: '4 Boeren',
  vier_tienen: '4 Tienen',
  vier_azen: '4 Azen',
  pit: 'Pit',
} as const

export function getDealerSeat(handNumber: number): 1 | 2 | 3 | 4 {
  return (((handNumber - 1) % 4) + 1) as 1 | 2 | 3 | 4
}

export function getTrumpMakerSeat(dealerSeat: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 {
  return ((dealerSeat % 4) + 1) as 1 | 2 | 3 | 4
}

export function isTeamA(seat: number): boolean {
  return seat === 1 || seat === 3
}
