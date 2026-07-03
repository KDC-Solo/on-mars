import { useCallback, useEffect, useState } from 'react'
import type { GameState } from './engine/game'
import { deserialize, serialize } from './engine/game'

const STORAGE_KEY = 'on-mars-solo-save'
const MAX_HISTORY = 100

interface Persisted {
  history: string[]
}

function load(): GameState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const p = JSON.parse(raw) as Persisted
    return p.history.map(deserialize)
  } catch {
    return []
  }
}

/** Undo/redo store over immutable GameStates, autosaved to localStorage. */
export function useGameStore() {
  const [history, setHistory] = useState<GameState[]>(load)
  const [future, setFuture] = useState<GameState[]>([])
  const state = history.length > 0 ? history[history.length - 1] : null

  useEffect(() => {
    const persisted: Persisted = { history: history.slice(-MAX_HISTORY).map(serialize) }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  }, [history])

  const apply = useCallback((next: GameState) => {
    setHistory((h) => [...h.slice(-MAX_HISTORY + 1), next])
    setFuture([])
  }, [])

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length <= 1) return h
      setFuture((f) => [h[h.length - 1], ...f])
      return h.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f
      setHistory((h) => [...h, f[0]])
      return f.slice(1)
    })
  }, [])

  const reset = useCallback(() => {
    setHistory([])
    setFuture([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { state, apply, undo, redo, reset, canUndo: history.length > 1, canRedo: future.length > 0 }
}
