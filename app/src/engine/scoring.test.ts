import { describe, expect, it } from 'vitest'
import { CONTRACTS } from '../data/contracts'
import { createLacerda } from './lacerda'
import {
  blueprintsOP,
  EMPTY_BOARD,
  LIVING_QUARTERS_OP,
  playerContractsOP,
  progressOP,
  scientistsOP,
  scoreLacerda,
  scorePlayer,
  verdict,
} from './scoring'

describe('end-game scoring', () => {
  it('maps progress cubes to 0/1/2/4/7/11 OP and clamps', () => {
    expect([0, 1, 2, 3, 4, 5].map(progressOP)).toEqual([0, 1, 2, 4, 7, 11])
    expect(progressOP(9)).toBe(11)
    expect(progressOP(-1)).toBe(0)
  })

  it('scores blueprints ±3/±5 by level (rulebook example: 3 + 3 − 3 + 5 = 8)', () => {
    // Two built L1 (+3+3), one unbuilt L1 (−3), one built L3 (+5) — Green's example.
    expect(blueprintsOP([1, 2, 13], [3])).toBe(8)
  })

  it('scores scientists per matching advanced building (Hydrologist example: 2 greenhouses = 6)', () => {
    expect(scientistsOP(['hydrologist'], { ...EMPTY_BOARD, greenhouse: 2 })).toBe(6)
  })

  it('applies Lacerda solo exceptions: full living quarters, kept ships, auto contracts', () => {
    let l = createLacerda()
    l = { ...l, ships: 4, contractOP: [12, 9], scientists: ['geologist'], blueprints: [1, 13], usedBlueprints: [1] }
    const s = scoreLacerda(l, {
      trackOP: 30,
      techOP: 10,
      progressCubes: 3,
      board: { ...EMPTY_BOARD, generator: 2 },
    })
    // 30 track + 4 progress + 10 tech + 12 ships + (3 − 5) blueprints + 6 scientists + 21 contracts + 21 LQ
    expect(s.total).toBe(30 + 4 + 10 + 12 - 2 + 6 + 21 + 21)
    expect(s.lines.find((x) => x.label.includes('treated as full'))?.op).toBe(21)
  })

  it('exposes the Living Quarters ladder printed on the player board (rulebook p. 21)', () => {
    expect([...LIVING_QUARTERS_OP]).toEqual([0, 3, 6, 10, 15, 21])
  })

  it('catalogues 12 Earth Contracts: 6 upgrade (one per building) + 6 deliver', () => {
    const upgrades = CONTRACTS.filter((c) => c.type === 'upgrade')
    const delivers = CONTRACTS.filter((c) => c.type === 'deliver')
    expect(upgrades).toHaveLength(6)
    expect(new Set(upgrades.map((c) => c.type === 'upgrade' && c.building)).size).toBe(6)
    expect(delivers).toHaveLength(6)
    // Solo rules (rulebook p. 23) cite #11 as the Plants + Minerals delivery.
    const eleven = CONTRACTS.find((c) => c.id === 11)!
    expect(eleven.type === 'deliver' && eleven.requires.resources).toEqual({ plant: 3, mineral: 2 })
  })

  it('scores contracts from printed card values (p. 21 example: incomplete water delivery = −4)', () => {
    expect(playerContractsOP([{ id: 9, completed: false }])).toBe(-4)
    expect(playerContractsOP([{ id: 9, completed: true }])).toBe(9)
    // Upgrade contract: +12 done, −6 failed; mixed net.
    expect(
      playerContractsOP([
        { id: 4, completed: true },
        { id: 11, completed: true },
        { id: 7, completed: false },
      ])
    ).toBe(12 + 9 - 4)
  })

  it('computes the verdict margin against the solo goal requirement', () => {
    const player = scorePlayer({
      trackOP: 50,
      progressCubes: 5,
      techOP: 18,
      ships: 2,
      builtL1: 2,
      builtL3: 1,
      unbuiltL1: 1,
      unbuiltL3: 0,
      scientists: ['hydrologist'],
      contracts: [{ id: 1, completed: true }],
      colonistsOP: 10,
      board: { ...EMPTY_BOARD, greenhouse: 2 },
    })
    // 50 + 11 + 18 + 6 + 8 + 6 + 12 + 10 = 121
    expect(player.total).toBe(121)

    const lacerda = { lines: [], total: 100 }
    expect(verdict(player, lacerda, 'first-colonists')).toMatchObject({ margin: 21, required: 1, marginMet: true })
    expect(verdict(player, lacerda, 'hunky-dory').marginMet).toBe(true)
    expect(verdict(player, lacerda, 'martian-potato').marginMet).toBe(false)
  })
})
