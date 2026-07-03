/**
 * Deterministic RNG (mulberry32). The whole game state — including RNG state —
 * is serializable, so undo/redo and save/resume replay identically.
 */
export interface RngState {
  seed: number
}

export function createRng(seed: number): RngState {
  return { seed: seed >>> 0 }
}

/** Returns a float in [0, 1) and the advanced state. Pure — never mutates. */
export function nextFloat(state: RngState): { value: number; state: RngState } {
  let t = (state.seed + 0x6d2b79f5) >>> 0
  const newState = { seed: t }
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, state: newState }
}

export function nextInt(state: RngState, maxExclusive: number): { value: number; state: RngState } {
  const { value, state: s } = nextFloat(state)
  return { value: Math.floor(value * maxExclusive), state: s }
}

/** Fisher–Yates shuffle. Pure — returns a new array and advanced RNG state. */
export function shuffle<T>(items: readonly T[], state: RngState): { items: T[]; state: RngState } {
  const result = [...items]
  let s = state
  for (let i = result.length - 1; i > 0; i--) {
    const r = nextInt(s, i + 1)
    s = r.state
    ;[result[i], result[r.value]] = [result[r.value], result[i]]
  }
  return { items: result, state: s }
}
