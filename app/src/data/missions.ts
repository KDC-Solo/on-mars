import type { MissionCard } from './types'

/** The 9 Mission cards (docs/card-database.md, verified against the Reference Book). */
export const MISSIONS: readonly MissionCard[] = [
  { id: 1, name: 'Research tiles taken from the map', required: { p2: 5, p3: 5, p4: 7 }, rewardCrystals: 2 },
  { id: 2, name: 'Blueprints taken from the display', required: { p2: 10, p3: 10, p4: 13 }, rewardCrystals: 1 },
  { id: 3, name: 'Advanced Buildings on the map', required: { p2: 8, p3: 8, p4: 10 }, rewardCrystals: 1 },
  { id: 4, name: 'Bots placed on the map (initial Bots excluded)', required: { p2: 3, p3: 4, p4: 5 }, rewardCrystals: 2 },
  { id: 5, name: 'Discovery tiles taken from the map by Rovers', required: { p2: 5, p3: 7, p4: 9 }, rewardCrystals: 1 },
  { id: 6, name: 'Techs taken from the display', required: { p2: 7, p3: 11, p4: 12 }, rewardCrystals: 1 },
  { id: 7, name: 'Cubes placed in the Progress area', required: { p2: 8, p3: 11, p4: 14 }, rewardCrystals: 1 },
  { id: 8, name: 'Scientists taken from the display', required: { p2: 4, p3: 4, p4: 5 }, rewardCrystals: 2 },
  { id: 9, name: 'Earth Contracts completed', required: { p2: 2, p3: 2, p4: 3 }, rewardCrystals: 1 },
]

export function missionById(id: number): MissionCard {
  const m = MISSIONS.find((x) => x.id === id)
  if (!m) throw new Error(`Unknown mission id ${id}`)
  return m
}
