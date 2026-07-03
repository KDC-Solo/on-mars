import type { SoloGoalCard } from '../data/types'
import { soloCardById } from '../data/soloDeck'
import type { DeckState } from './deck'
import { createDeck, lacerdaTravels, resolveAmbiguity, reveal } from './deck'
import type { LacerdaState } from './lacerda'
import { advanceBot, createLacerda, gainCrystals, spendCrystals } from './lacerda'
import type { RngState } from './rng'
import { createRng, nextInt } from './rng'
import type { MissionSetup, Step } from './turn'
import {
  actionSteps,
  colonistCostStep,
  colonyLevelUpSteps,
  describeCard,
  missionCubeStep,
  ROVER_FALLBACK_STEP,
  travelSteps,
  TURN_ORDER_BENEFIT_STEP,
} from './turn'
import type { BuildingType, ScientistId } from '../data/types'

export interface LogEntry {
  turn: number
  text: string
}

export interface GameState {
  rng: RngState
  deck: DeckState
  lacerda: LacerdaState
  missions: MissionSetup
  soloGoalId: SoloGoalCard['id']
  colonyLevel: number
  turn: number
  log: LogEntry[]
  /** Player's ticks on the Solo Goal requirement checklist. */
  goalChecked: boolean[]
}

export interface GameConfig {
  seed: number
  missions: MissionSetup
  soloGoalId: SoloGoalCard['id']
}

export function newGame(config: GameConfig): GameState {
  const rng0 = createRng(config.seed)
  const { deck, rng } = createDeck(rng0)
  return {
    rng,
    deck,
    lacerda: createLacerda(),
    missions: config.missions,
    soloGoalId: config.soloGoalId,
    colonyLevel: 1,
    turn: 0,
    log: [],
    goalChecked: [],
  }
}

export function toggleGoalRequirement(state: GameState, index: number): GameState {
  const next = [...state.goalChecked]
  next[index] = !next[index]
  return { ...state, goalChecked: next }
}

function log(state: GameState, text: string): GameState {
  return { ...state, log: [...state.log, { turn: state.turn, text }] }
}

export interface TurnResult {
  state: GameState
  steps: Step[]
}

/** Reveal the next solo card and produce the turn's instruction script. */
export function beginLacerdaTurn(state: GameState, occupiedSlots: number): TurnResult {
  const r = reveal(state.deck, state.rng)
  let s: GameState = {
    ...state,
    deck: r.deck,
    rng: r.rng,
    turn: state.turn + 1,
  }
  const steps: Step[] = [{ text: describeCard(r.card) }]
  s = log(s, describeCard(r.card))

  if (r.moveMissionCube) {
    const m = missionCubeStep(r.card, s.missions)
    steps.push(m.step)
    s = { ...s, lacerda: gainCrystals(s.lacerda, m.crystals) }
    s = log(s, m.step.text)
  }

  const cost = colonistCostStep(occupiedSlots, s.lacerda)
  steps.push(cost.step)
  if (!cost.affordable) {
    steps.push(ROVER_FALLBACK_STEP)
    s = log(s, 'Action unaffordable — Rover moved instead.')
    return { state: s, steps }
  }
  if (cost.cost > 0) {
    s = { ...s, lacerda: spendCrystals(s.lacerda, cost.cost) }
    s = log(s, `Paid ${cost.cost} Crystal(s) for Colonist placement.`)
  }

  steps.push(...actionSteps(s.lacerda, r.card.action))
  return { state: s, steps }
}

/** The player reports the action could not be performed; Lacerda moves his Rover. */
export function reportIllegalAction(state: GameState): TurnResult {
  return { state: log(state, 'Action illegal — Rover moved instead.'), steps: [ROVER_FALLBACK_STEP] }
}

/** Shuttle phase: travel decision from the last card, then a random Turn Order space. */
export function shuttlePhase(
  state: GameState,
  availableTurnOrderSpaces: number
): TurnResult {
  if (!lacerdaTravels(state.deck)) {
    const s = log(state, 'Shuttle phase: last card shows ✗ — Lacerda does not travel.')
    return { state: s, steps: [{ text: 'Lacerda does NOT travel (the last solo card shows the ✗).' }] }
  }
  const destination = state.lacerda.location === 'orbit' ? 'colony' : 'orbit'
  const pick = nextInt(state.rng, Math.max(1, availableTurnOrderSpaces))
  let s: GameState = {
    ...state,
    rng: pick.state,
    lacerda: { ...state.lacerda, location: destination },
  }
  const steps: Step[] = [
    {
      text: `Lacerda travels to ${destination === 'orbit' ? 'Orbit' : 'the Colony'}. Counting available Turn Order spaces from the left, he takes space #${pick.value + 1}.`,
    },
    TURN_ORDER_BENEFIT_STEP,
    ...travelSteps(destination),
  ]
  s = log(s, `Shuttle: traveled to ${destination}, Turn Order space #${pick.value + 1} of ${availableTurnOrderSpaces}.`)
  return { state: s, steps }
}

/** Resolve a tie between 2–3 options with the solo deck, per the rulebook procedure. */
export function ambiguity(state: GameState, options: string[]): {
  state: GameState
  choice: string
  steps: Step[]
} {
  const n = Math.min(Math.max(options.length, 2), 3) as 2 | 3
  const r = resolveAmbiguity(state.deck, state.rng, n)
  const choice = options[r.chosenIndex] ?? options[options.length - 1]
  const drawnDesc = r.drawn.map((id) => `#${soloCardById(id).action}`).join(', ')
  const s = log(
    { ...state, deck: r.deck, rng: r.rng },
    `Ambiguity: options [${options.join(' / ')}] → drew ${drawnDesc} → ${choice}`
  )
  return {
    state: s,
    choice,
    steps: [{ text: `Ambiguity resolved: ${choice} (cards drawn: ${drawnDesc}, shuffled back).` }],
  }
}

export function colonyLevelUp(state: GameState): TurnResult {
  let s: GameState = {
    ...state,
    colonyLevel: state.colonyLevel + 1,
    lacerda: {
      ...state.lacerda,
      shelters: state.lacerda.shelters + 1,
      ships: state.lacerda.ships + 1,
      bots: state.lacerda.bots + 1,
    },
  }
  s = log(s, `Colony leveled up to ${s.colonyLevel}: Lacerda built a Shelter, welcomed a Ship, took a Bot.`)
  return { state: s, steps: colonyLevelUpSteps() }
}

/** Player reports which Building Lacerda constructed; his Bot advances past it. */
export function recordConstruction(state: GameState, built: BuildingType): GameState {
  const lacerda = built === 'shelter' ? state.lacerda : advanceBot(state.lacerda, built)
  return log({ ...state, lacerda }, `Constructed a ${built}; Bot advanced.`)
}

export function recordBlueprint(state: GameState, blueprintId: number, gainsCrystal: boolean): GameState {
  let lacerda = { ...state.lacerda, blueprints: [...state.lacerda.blueprints, blueprintId] }
  if (gainsCrystal) lacerda = gainCrystals(lacerda, 1)
  return log({ ...state, lacerda }, `Took Blueprint #${blueprintId}${gainsCrystal ? ' (+1 Crystal)' : ''}.`)
}

export function recordBlueprintUsed(state: GameState, blueprintId: number): GameState {
  return log(
    {
      ...state,
      lacerda: { ...state.lacerda, usedBlueprints: [...state.lacerda.usedBlueprints, blueprintId] },
    },
    `Used Blueprint #${blueprintId} to upgrade.`
  )
}

export function recordScientist(state: GameState, id: ScientistId): GameState {
  return log(
    { ...state, lacerda: { ...state.lacerda, scientists: [...state.lacerda.scientists, id] } },
    `Hired Scientist: ${id}.`
  )
}

export function recordContract(state: GameState, op: number): GameState {
  return log(
    { ...state, lacerda: { ...state.lacerda, contractOP: [...state.lacerda.contractOP, op] } },
    `Took Contract worth ${op} OP (auto-completed).`
  )
}

export function recordTech(state: GameState): GameState {
  return log(
    { ...state, lacerda: { ...state.lacerda, techCount: state.lacerda.techCount + 1 } },
    'Learned a Tech.'
  )
}

export function serialize(state: GameState): string {
  return JSON.stringify(state)
}

export function deserialize(json: string): GameState {
  // Older saves may predate later-added fields; default them.
  const parsed = JSON.parse(json) as GameState
  return { ...parsed, goalChecked: parsed.goalChecked ?? [] }
}
