import type { SoloCard } from './types'

/**
 * The 12 solo cards, catalogued from the physical deck (docs/solo-deck.md).
 * Distribution: 4 per Mission letter, exactly one no-travel card per letter,
 * actions 1/2/3 appear 5/4/3 times.
 */
export const SOLO_DECK: readonly SoloCard[] = [
  { id: 1, mission: 'A', travels: true, action: 2 },
  { id: 2, mission: 'A', travels: false, action: 2 },
  { id: 3, mission: 'A', travels: true, action: 1 },
  { id: 4, mission: 'A', travels: true, action: 3 },
  { id: 5, mission: 'B', travels: true, action: 1 },
  { id: 6, mission: 'B', travels: false, action: 3 },
  { id: 7, mission: 'B', travels: true, action: 1 },
  { id: 8, mission: 'B', travels: true, action: 2 },
  { id: 9, mission: 'C', travels: false, action: 1 },
  { id: 10, mission: 'C', travels: true, action: 2 },
  { id: 11, mission: 'C', travels: true, action: 1 },
  { id: 12, mission: 'C', travels: true, action: 3 },
]

export function soloCardById(id: number): SoloCard {
  const card = SOLO_DECK.find((c) => c.id === id)
  if (!card) throw new Error(`Unknown solo card id ${id}`)
  return card
}
