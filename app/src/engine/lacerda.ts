import type { BuildingType, ScientistId } from '../data/types'
import { LSS_SEQUENCE } from '../data/types'

/**
 * Everything the app owns about Lacerda (the hybrid model's non-spatial state).
 * Spatial facts (map, rover position) stay on the table; the engine asks the
 * player when a decision needs them.
 */
export interface LacerdaState {
  location: 'orbit' | 'colony'
  crystals: number
  /** Crystals are capped by empty Depot spaces; starts at 6 per player board. */
  depotCapacity: number
  /** Index into LSS_SEQUENCE for his Bot icon position (starts on the Mine). */
  botSequenceIndex: number
  /** Blueprint card ids, split by whether he has used them to upgrade. */
  blueprints: number[]
  usedBlueprints: number[]
  scientists: ScientistId[]
  /** OP values of taken Contracts (auto-completed for Lacerda). */
  contractOP: number[]
  techCount: number
  shelters: number
  ships: number
  bots: number
}

export function createLacerda(): LacerdaState {
  return {
    location: 'orbit',
    crystals: 0,
    depotCapacity: 6,
    botSequenceIndex: 0,
    blueprints: [],
    usedBlueprints: [],
    scientists: [],
    contractOP: [],
    techCount: 0,
    shelters: 0,
    ships: 0,
    bots: 0,
  }
}

export function botIcon(state: LacerdaState): BuildingType {
  return LSS_SEQUENCE[state.botSequenceIndex]
}

export function advanceBot(state: LacerdaState, from?: BuildingType): LacerdaState {
  const start = from ? LSS_SEQUENCE.indexOf(from) : state.botSequenceIndex
  return { ...state, botSequenceIndex: (start + 1) % LSS_SEQUENCE.length }
}

/** Gains respect the Depot cap ("The number of Crystals he can store is limited to spaces in his Depot"). */
export function gainCrystals(state: LacerdaState, amount: number): LacerdaState {
  return { ...state, crystals: Math.min(state.depotCapacity, state.crystals + amount) }
}

export function spendCrystals(state: LacerdaState, amount: number): LacerdaState {
  if (state.crystals < amount) throw new Error('Lacerda cannot afford this')
  return { ...state, crystals: state.crystals - amount }
}

export function canAfford(state: LacerdaState, amount: number): boolean {
  return state.crystals >= amount
}
