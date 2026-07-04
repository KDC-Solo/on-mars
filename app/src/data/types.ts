/** Shared vocabulary for On Mars card data and the Lacerda engine. */

export type MissionSlot = 'A' | 'B' | 'C'

export type ActionNumber = 1 | 2 | 3

export type BuildingType =
  | 'mine'
  | 'generator'
  | 'waterExtractor'
  | 'greenhouse'
  | 'oxygenCondenser'
  | 'shelter'

/** The LSS icon loop Lacerda's Bot walks (Shelters are not part of it). */
export const LSS_SEQUENCE: readonly BuildingType[] = [
  'mine',
  'generator',
  'waterExtractor',
  'greenhouse',
  'oxygenCondenser',
]

export type ScientistId =
  | 'geologist'
  | 'rdEngineer'
  | 'hydrologist'
  | 'biochemist'
  | 'geochemist'
  | 'systemsEngineer'

export interface SoloCard {
  id: number
  /** Which Mission's tracker cube moves (from the 2nd pass through the deck). */
  mission: MissionSlot
  /** False = the card shows the ✗: Lacerda skips Shuttle travel. */
  travels: boolean
  /** Astronaut number: which numbered action Lacerda performs. */
  action: ActionNumber
}

export interface MissionCard {
  id: number
  name: string
  /** Requirement count by player count; solo uses the 2-player column. */
  required: { p2: number; p3: number; p4: number }
  /** Crystals gained per contribution. */
  rewardCrystals: 1 | 2
}

export interface ScientistCard {
  id: ScientistId
  name: string
  hireCost: string
  worksIn: BuildingType
  /** Scores 3 OP per upgraded building of this type on Mars (any player's). */
  scoresPerUpgraded: BuildingType
}

export interface BlueprintCard {
  id: number
  name: string
  /** 1 = upgrades any size (±3 OP), 3 = needs Complex ≥ 3 (±5 OP). */
  level: 1 | 3
  upgrades: BuildingType
  matchingScientist: ScientistId
  gainOnObtain: string
}

export type ResourceType = 'mineral' | 'battery' | 'water' | 'plant' | 'oxygen'

export type ContractCard =
  | {
      id: number
      type: 'upgrade'
      /** Needs your Advanced Building marker on a Complex of this type, size ≥ 4. */
      building: BuildingType
      opComplete: 12
      opFailed: -6
    }
  | {
      id: number
      type: 'deliver'
      /** Resources/Crystals that must sit on the card at game end (Minerals never substitute). */
      requires: { resources: Partial<Record<ResourceType, number>>; crystals?: number }
      opComplete: 9
      opFailed: -4
    }

export interface PrivateGoalCard {
  id: number
  goal: string
  /** Every card's other reward option is "Develop ×2 at no cost". */
  altReward: string
}

export interface SoloGoalCard {
  id: 'first-colonists' | 'next-generation' | 'hunky-dory' | 'martian-potato'
  name: string
  level: string
  requirements: string[]
}
