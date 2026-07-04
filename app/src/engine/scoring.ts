import { BLUEPRINTS } from '../data/blueprints'
import { CONTRACTS } from '../data/contracts'
import { SCIENTISTS } from '../data/scientists'
import type { BuildingType, ScientistId, SoloGoalCard } from '../data/types'
import type { LacerdaState } from './lacerda'

/**
 * End-game scoring (Rulebook p. 21, Reference Book p. 7) with the solo
 * exceptions from p. 22: Lacerda's Living Quarters count as full, he keeps
 * every Ship he welcomed, and his Contracts are automatically completed.
 */

/** Advanced (upgraded) Buildings on Mars by type — any player's count. */
export type BoardCounts = Record<BuildingType, number>

export const EMPTY_BOARD: BoardCounts = {
  mine: 0,
  generator: 0,
  waterExtractor: 0,
  greenhouse: 0,
  oxygenCondenser: 0,
  shelter: 0,
}

/** 1/2/4/7/11 OP for 1–5 cubes in the Progress area. */
export const PROGRESS_OP = [0, 1, 2, 4, 7, 11] as const

/**
 * OP values printed up the Living Quarters ladder (Rulebook p. 21: score the
 * number next to your highest located Colonist; 0 if none reaches the first mark).
 */
export const LIVING_QUARTERS_OP = [0, 3, 6, 10, 15, 21] as const

/** Highest Living Quarters slot value — what a full LQ scores. */
export const FULL_LIVING_QUARTERS_OP = 21

export const OP_PER_SHIP = 3

export function progressOP(cubes: number): number {
  return PROGRESS_OP[Math.max(0, Math.min(5, Math.floor(cubes)))]
}

export function scientistsOP(ids: readonly ScientistId[], board: BoardCounts): number {
  return ids.reduce((sum, id) => {
    const s = SCIENTISTS.find((x) => x.id === id)!
    return sum + 3 * (board[s.scoresPerUpgraded] ?? 0)
  }, 0)
}

function blueprintValue(id: number): number {
  return BLUEPRINTS.find((b) => b.id === id)!.level === 1 ? 3 : 5
}

/** +3/+5 per built Blueprint, −3/−5 per unbuilt one. */
export function blueprintsOP(builtIds: readonly number[], unbuiltIds: readonly number[]): number {
  return (
    builtIds.reduce((s, id) => s + blueprintValue(id), 0) -
    unbuiltIds.reduce((s, id) => s + blueprintValue(id), 0)
  )
}

export interface ScoreLine {
  label: string
  op: number
}

export interface ScoreBreakdown {
  lines: ScoreLine[]
  total: number
}

function sum(lines: ScoreLine[]): ScoreBreakdown {
  return { lines, total: lines.reduce((s, x) => s + x.op, 0) }
}

export interface LacerdaScoreInput {
  /** His position on the OP track (in-game scoring). */
  trackOP: number
  /** Sum of the printed values under his Lab columns. */
  techOP: number
  /** His Progress cubes in the Progress area (0–5). */
  progressCubes: number
  board: BoardCounts
}

export function scoreLacerda(l: LacerdaState, input: LacerdaScoreInput): ScoreBreakdown {
  const unbuilt = l.blueprints.filter((id) => !l.usedBlueprints.includes(id))
  return sum([
    { label: 'OP track (scored in-game)', op: input.trackOP },
    { label: `Progress cubes (${input.progressCubes})`, op: progressOP(input.progressCubes) },
    { label: 'Tech tiles in Lab', op: input.techOP },
    { label: `Ships kept (${l.ships} × ${OP_PER_SHIP})`, op: l.ships * OP_PER_SHIP },
    {
      label: `Advanced Buildings built (${l.usedBlueprints.length}) − unbuilt Blueprints (${unbuilt.length})`,
      op: blueprintsOP(l.usedBlueprints, unbuilt),
    },
    { label: 'Scientists (3 OP × matching Advanced Buildings)', op: scientistsOP(l.scientists, input.board) },
    {
      label: `Earth Contracts (auto-completed, ${l.contractOP.length})`,
      op: l.contractOP.reduce((a, b) => a + b, 0),
    },
    { label: 'Living Quarters (treated as full)', op: FULL_LIVING_QUARTERS_OP },
  ])
}

/** One Earth Contract the player holds and whether they completed it. */
export interface PlayerContractEntry {
  id: number
  completed: boolean
}

/** Net contract OP from the printed card values (+12/−6 upgrade, +9/−4 deliver). */
export function playerContractsOP(entries: readonly PlayerContractEntry[]): number {
  return entries.reduce((s, e) => {
    const card = CONTRACTS.find((c) => c.id === e.id)!
    return s + (e.completed ? card.opComplete : card.opFailed)
  }, 0)
}

export interface PlayerScoreInput {
  trackOP: number
  progressCubes: number
  techOP: number
  ships: number
  builtL1: number
  builtL3: number
  unbuiltL1: number
  unbuiltL3: number
  scientists: ScientistId[]
  contracts: readonly PlayerContractEntry[]
  colonistsOP: number
  board: BoardCounts
}

export function scorePlayer(p: PlayerScoreInput): ScoreBreakdown {
  const advanced = p.builtL1 * 3 + p.builtL3 * 5 - (p.unbuiltL1 * 3 + p.unbuiltL3 * 5)
  const done = p.contracts.filter((c) => c.completed).length
  const failed = p.contracts.length - done
  return sum([
    { label: 'OP track (scored in-game)', op: p.trackOP },
    { label: `Progress cubes (${p.progressCubes})`, op: progressOP(p.progressCubes) },
    { label: 'Tech tiles in Lab', op: p.techOP },
    { label: `Ships in Hangar (${p.ships} × ${OP_PER_SHIP})`, op: p.ships * OP_PER_SHIP },
    { label: 'Advanced Buildings − unbuilt Blueprints', op: advanced },
    { label: 'Scientists (3 OP × matching Advanced Buildings)', op: scientistsOP(p.scientists, p.board) },
    { label: `Earth Contracts (${done} ✓, ${failed} ✗)`, op: playerContractsOP(p.contracts) },
    { label: 'Colonists (highest Living Quarters slot)', op: p.colonistsOP },
  ])
}

/** OP margin over Lacerda each Solo Goal demands. */
export function requiredMargin(goalId: SoloGoalCard['id']): number {
  switch (goalId) {
    case 'first-colonists':
      return 1
    case 'next-generation':
      return 10
    case 'hunky-dory':
      return 20
    case 'martian-potato':
      return 30
  }
}

export interface Verdict {
  playerTotal: number
  lacerdaTotal: number
  margin: number
  required: number
  marginMet: boolean
}

export function verdict(
  player: ScoreBreakdown,
  lacerda: ScoreBreakdown,
  goalId: SoloGoalCard['id']
): Verdict {
  const margin = player.total - lacerda.total
  const required = requiredMargin(goalId)
  return {
    playerTotal: player.total,
    lacerdaTotal: lacerda.total,
    margin,
    required,
    marginMet: margin >= required,
  }
}
