import type { ContractCard } from './types'

/**
 * The 12 Earth Contract cards (Reference Book p. 3; per-card contents decoded
 * from the Dice Tower unboxing video — see docs/card-database.md).
 *
 * Numbering: the solo rules cite "the Delivery Contract with Plants and
 * Minerals (#11)" (Rulebook p. 23); with the six Upgrade contracts as #1–6,
 * the factory deck order puts the Deliver contracts at #7–12, which makes
 * Plants + Minerals land exactly on #11.
 */
export const CONTRACTS: readonly ContractCard[] = [
  { id: 1, type: 'upgrade', building: 'mine', opComplete: 12, opFailed: -6 },
  { id: 2, type: 'upgrade', building: 'generator', opComplete: 12, opFailed: -6 },
  { id: 3, type: 'upgrade', building: 'waterExtractor', opComplete: 12, opFailed: -6 },
  { id: 4, type: 'upgrade', building: 'greenhouse', opComplete: 12, opFailed: -6 },
  { id: 5, type: 'upgrade', building: 'oxygenCondenser', opComplete: 12, opFailed: -6 },
  { id: 6, type: 'upgrade', building: 'shelter', opComplete: 12, opFailed: -6 },
  { id: 7, type: 'deliver', requires: { resources: { mineral: 4 } }, opComplete: 9, opFailed: -4 },
  {
    id: 8,
    type: 'deliver',
    requires: { resources: { battery: 3, mineral: 2 } },
    opComplete: 9,
    opFailed: -4,
  },
  {
    id: 9,
    type: 'deliver',
    requires: { resources: { water: 3, mineral: 2 } },
    opComplete: 9,
    opFailed: -4,
  },
  {
    id: 10,
    type: 'deliver',
    requires: { resources: { oxygen: 3, mineral: 2 } },
    opComplete: 9,
    opFailed: -4,
  },
  {
    id: 11,
    type: 'deliver',
    requires: { resources: { plant: 3, mineral: 2 } },
    opComplete: 9,
    opFailed: -4,
  },
  {
    id: 12,
    type: 'deliver',
    requires: { resources: { mineral: 2 }, crystals: 3 },
    opComplete: 9,
    opFailed: -4,
  },
] as const
