import { describe, expect, it } from 'vitest'
import { SOLO_DECK } from '../data/soloDeck'
import { MISSIONS } from '../data/missions'
import { PRIVATE_GOALS } from '../data/privateGoals'
import { BLUEPRINTS } from '../data/blueprints'
import { SCIENTISTS } from '../data/scientists'
import { SOLO_GOALS } from '../data/soloGoals'
import { createRng } from './rng'
import { createDeck, lacerdaTravels, resolveAmbiguity, reveal } from './deck'
import { createLacerda, gainCrystals, advanceBot, botIcon } from './lacerda'
import {
  ambiguity,
  beginLacerdaTurn,
  colonyLevelUp,
  deserialize,
  newGame,
  recordConstruction,
  serialize,
  shuttlePhase,
} from './game'

describe('card data integrity', () => {
  it('solo deck matches the catalogued distribution', () => {
    expect(SOLO_DECK).toHaveLength(12)
    for (const letter of ['A', 'B', 'C'] as const) {
      const cards = SOLO_DECK.filter((c) => c.mission === letter)
      expect(cards).toHaveLength(4)
      expect(cards.filter((c) => !c.travels)).toHaveLength(1)
    }
    const byAction = (n: number) => SOLO_DECK.filter((c) => c.action === n).length
    expect([byAction(1), byAction(2), byAction(3)]).toEqual([5, 4, 3])
  })

  it('other card sets have the component-list counts', () => {
    expect(MISSIONS).toHaveLength(9)
    expect(PRIVATE_GOALS).toHaveLength(16)
    expect(BLUEPRINTS).toHaveLength(24)
    expect(SCIENTISTS).toHaveLength(6)
    expect(SOLO_GOALS).toHaveLength(4)
    expect(BLUEPRINTS.filter((b) => b.level === 1)).toHaveLength(12)
    expect(BLUEPRINTS.filter((b) => b.level === 3)).toHaveLength(12)
  })

  it('scientists form the work/score cycle one building apart', () => {
    for (const s of SCIENTISTS) {
      expect(s.worksIn).not.toBe(s.scoresPerUpgraded)
    }
  })
})

describe('solo deck engine', () => {
  it('reveals all 12 cards before reshuffling, then flags mission cubes', () => {
    let { deck, rng } = createDeck(createRng(42))
    const seen = new Set<number>()
    for (let i = 0; i < 12; i++) {
      const r = reveal(deck, rng)
      expect(r.moveMissionCube).toBe(false)
      seen.add(r.card.id)
      deck = r.deck
      rng = r.rng
    }
    expect(seen.size).toBe(12)
    expect(deck.drawPile).toHaveLength(0)

    const r13 = reveal(deck, rng)
    expect(r13.moveMissionCube).toBe(true)
    expect(r13.deck.timesReshuffled).toBe(1)
    expect(r13.deck.drawPile).toHaveLength(11)
  })

  it('travel decision follows the last revealed card', () => {
    let { deck, rng } = createDeck(createRng(7))
    expect(lacerdaTravels(deck)).toBe(true)
    for (let i = 0; i < 12; i++) {
      const r = reveal(deck, rng)
      expect(lacerdaTravels(r.deck)).toBe(r.card.travels)
      deck = r.deck
      rng = r.rng
    }
  })

  it('ambiguity resolution preserves deck size and respects option weights', () => {
    const counts = [0, 0, 0]
    for (let seed = 0; seed < 300; seed++) {
      const { deck, rng } = createDeck(createRng(seed))
      const r = resolveAmbiguity(deck, rng, 3)
      expect(r.chosenIndex).toBeGreaterThanOrEqual(0)
      expect(r.chosenIndex).toBeLessThan(3)
      expect(r.deck.drawPile.length + r.deck.discard.length).toBe(12)
      counts[r.chosenIndex]++
    }
    // Weighted 5:4:3 — option 1 must beat option 3 clearly over 300 trials.
    expect(counts[0]).toBeGreaterThan(counts[2])
  })

  it('ambiguity with 2 options never picks a third', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { deck, rng } = createDeck(createRng(seed))
      const r = resolveAmbiguity(deck, rng, 2)
      expect(r.chosenIndex).toBeLessThan(2)
    }
  })
})

describe('lacerda state', () => {
  it('caps crystals at depot capacity', () => {
    let l = createLacerda()
    l = gainCrystals(l, 10)
    expect(l.crystals).toBe(l.depotCapacity)
  })

  it('bot walks the LSS loop', () => {
    let l = createLacerda()
    expect(botIcon(l)).toBe('mine')
    l = advanceBot(l)
    expect(botIcon(l)).toBe('generator')
    l = advanceBot(l, 'oxygenCondenser')
    expect(botIcon(l)).toBe('mine')
  })
})

describe('game flow', () => {
  const config = { seed: 1, missions: { A: 1, B: 4, C: 8 }, soloGoalId: 'first-colonists' as const }

  it('turns are reproducible for a given seed', () => {
    const a = beginLacerdaTurn(newGame(config), 0)
    const b = beginLacerdaTurn(newGame(config), 0)
    expect(a.steps).toEqual(b.steps)
    expect(serialize(a.state)).toBe(serialize(b.state))
  })

  it('pays colonist placement costs from crystals or falls back to the rover', () => {
    let g = newGame(config)
    g = { ...g, lacerda: gainCrystals(g.lacerda, 2) }
    const paid = beginLacerdaTurn(g, 2)
    expect(paid.state.lacerda.crystals).toBe(0)

    const broke = beginLacerdaTurn(newGame(config), 2)
    expect(broke.steps.some((s) => s.text.includes('Rover'))).toBe(true)
  })

  it('second pass grants mission crystals automatically', () => {
    let g = newGame(config)
    for (let i = 0; i < 12; i++) g = beginLacerdaTurn(g, 0).state
    const before = g.lacerda.crystals
    g = beginLacerdaTurn(g, 0).state
    expect(g.lacerda.crystals).toBeGreaterThan(before)
  })

  it('shuttle phase toggles location and stays put on ✗ cards', () => {
    let g = newGame(config)
    // Find a state whose last card forbids travel.
    let guard = 0
    while (lacerdaTravels(g.deck) && guard++ < 24) g = beginLacerdaTurn(g, 0).state
    const stay = shuttlePhase(g, 3)
    expect(stay.state.lacerda.location).toBe(g.lacerda.location)

    // And one that allows it.
    let g2 = newGame(config)
    guard = 0
    while (!lacerdaTravels(g2.deck) && guard++ < 24) g2 = beginLacerdaTurn(g2, 0).state
    const from = g2.lacerda.location
    const moved = shuttlePhase(g2, 3)
    expect(moved.state.lacerda.location).not.toBe(from)
  })

  it('colony level-up grants shelter, ship and bot', () => {
    const g = colonyLevelUp(newGame(config))
    expect(g.state.colonyLevel).toBe(2)
    expect(g.state.lacerda.shelters).toBe(1)
    expect(g.state.lacerda.ships).toBe(1)
    expect(g.state.lacerda.bots).toBe(1)
  })

  it('construction advances the bot past the built building (rulebook example)', () => {
    // Rulebook p. 23: Bot on Greenhouse; Greenhouse and Oxygen Condenser are
    // not buildable, so Lacerda constructs a Mine — the Bot then advances to
    // the icon after the Mine (Generator).
    let g = newGame(config)
    g = { ...g, lacerda: { ...g.lacerda, botSequenceIndex: 3 } }
    g = recordConstruction(g, 'mine')
    expect(botIcon(g.lacerda)).toBe('generator')
  })

  it('ambiguity logs the draw and returns one of the options', () => {
    const g = newGame(config)
    const r = ambiguity(g, ['left placement', 'right placement'])
    expect(['left placement', 'right placement']).toContain(r.choice)
    expect(r.state.log.at(-1)?.text).toContain('Ambiguity')
  })

  it('serialization round-trips', () => {
    const g = beginLacerdaTurn(newGame(config), 1).state
    expect(deserialize(serialize(g))).toEqual(g)
  })
})
