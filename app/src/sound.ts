/**
 * Subtle WebAudio console cues — synthesized, no assets. Every cue fires from
 * a user-gesture handler, so lazily creating the AudioContext is allowed.
 */

const STORAGE_KEY = 'om-sound'

let ctx: AudioContext | null = null
let enabled = typeof localStorage === 'undefined' || localStorage.getItem(STORAGE_KEY) !== 'off'

export function soundEnabled(): boolean {
  return enabled
}

export function setSoundEnabled(on: boolean): void {
  enabled = on
  localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
}

function beep(freq: number, dur: number, type: OscillatorType = 'sine', delay = 0, gain = 0.04) {
  if (!enabled) return
  try {
    ctx ??= new AudioContext()
    const t = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur)
  } catch {
    // Audio is a garnish — never let it break the console.
  }
}

export const cues = {
  /** Solo card revealed / transmission incoming. */
  reveal(): void {
    beep(520, 0.09, 'triangle')
    beep(780, 0.13, 'triangle', 0.09)
  },
  /** Instruction acknowledged. */
  done(): void {
    beep(660, 0.09)
  },
  /** Small state tick (records, checklist). */
  tick(): void {
    beep(880, 0.05, 'square', 0, 0.02)
  },
  /** Colony milestone. */
  levelUp(): void {
    beep(440, 0.09)
    beep(554, 0.09, 'sine', 0.09)
    beep(659, 0.18, 'sine', 0.18)
  },
  /** Illegal move — Rover fallback. */
  error(): void {
    beep(165, 0.2, 'sawtooth', 0, 0.045)
  },
}
