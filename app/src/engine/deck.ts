import { SOLO_DECK, soloCardById } from '../data/soloDeck'
import type { SoloCard } from '../data/types'
import type { RngState } from './rng'
import { shuffle } from './rng'

/**
 * Solo deck state machine (Rulebook p. 22):
 * - Reveal the top card each Lacerda turn; discard it.
 * - When empty, reshuffle discards on his next turn.
 * - From the 2nd pass onward (timesReshuffled >= 1), each reveal also moves
 *   the card's Mission tracker cube down one space.
 */
export interface DeckState {
  drawPile: number[]
  discard: number[]
  timesReshuffled: number
  /** Governs the Shuttle-phase travel decision ("most recent solo card"). */
  lastRevealed: number | null
}

export function createDeck(rng: RngState): { deck: DeckState; rng: RngState } {
  const { items, state } = shuffle(SOLO_DECK.map((c) => c.id), rng)
  return {
    deck: { drawPile: items, discard: [], timesReshuffled: 0, lastRevealed: null },
    rng: state,
  }
}

export interface RevealResult {
  card: SoloCard
  /** True from the second pass through the deck onward. */
  moveMissionCube: boolean
  deck: DeckState
  rng: RngState
}

export function reveal(deck: DeckState, rng: RngState): RevealResult {
  let drawPile = deck.drawPile
  let discard = deck.discard
  let timesReshuffled = deck.timesReshuffled
  let rngState = rng

  if (drawPile.length === 0) {
    const s = shuffle(discard, rngState)
    drawPile = s.items
    rngState = s.state
    discard = []
    timesReshuffled += 1
  }

  const [top, ...rest] = drawPile
  const card = soloCardById(top)
  return {
    card,
    moveMissionCube: timesReshuffled >= 1,
    deck: {
      drawPile: rest,
      discard: [...discard, top],
      timesReshuffled,
      lastRevealed: top,
    },
    rng: rngState,
  }
}

/** Travel decision for the Shuttle phase: Lacerda travels unless the last card shows the ✗. */
export function lacerdaTravels(deck: DeckState): boolean {
  if (deck.lastRevealed === null) return true
  return soloCardById(deck.lastRevealed).travels
}

export interface AmbiguityResult {
  /** 0-based index of the chosen option. */
  chosenIndex: number
  /** Card ids drawn during the procedure, last one is the match. */
  drawn: number[]
  deck: DeckState
  rng: RngState
}

/**
 * "Resolving Ambiguities" (Rulebook p. 23): number the options, draw solo cards
 * until a card's action number matches one, then shuffle the drawn cards back
 * into the deck. Options are implicitly weighted 5:4:3 (action distribution).
 * Supports 2 or 3 options; if the draw pile runs dry mid-procedure the discard
 * is shuffled in (this counts as the deck's reshuffle, advancing the pass count).
 */
export function resolveAmbiguity(
  deck: DeckState,
  rng: RngState,
  numOptions: 2 | 3
): AmbiguityResult {
  let drawPile = [...deck.drawPile]
  let discard = [...deck.discard]
  let timesReshuffled = deck.timesReshuffled
  let rngState = rng
  const drawn: number[] = []

  for (;;) {
    if (drawPile.length === 0) {
      if (discard.length === 0) {
        // Every card is in `drawn` without a match — impossible for 2–3 options
        // since actions 1 and 2 both appear in the deck, but guard anyway.
        throw new Error('Ambiguity resolution exhausted the deck')
      }
      const s = shuffle(discard, rngState)
      drawPile = s.items
      rngState = s.state
      discard = []
      timesReshuffled += 1
    }
    const top = drawPile.shift() as number
    drawn.push(top)
    const card = soloCardById(top)
    if (card.action <= numOptions) {
      const s = shuffle([...drawPile, ...drawn], rngState)
      return {
        chosenIndex: card.action - 1,
        drawn,
        deck: {
          drawPile: s.items,
          discard,
          timesReshuffled,
          lastRevealed: deck.lastRevealed,
        },
        rng: s.state,
      }
    }
  }
}
