import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../lib/pto'
import type { AsyncState } from '../types/pto'

// Runs `load` on mount / when it changes; `reload` re-runs it. Pass a memoized `load`.
export function useAsync<T>(load: (() => Promise<T>) | null, initial: T): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: initial, loading: load !== null, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!load) return
    let cancelled = false
    load()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((e: unknown) => !cancelled && setState((s) => ({ ...s, loading: false, error: errorMessage(e) })))
    return () => {
      cancelled = true
    }
  }, [load, tick])

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    setTick((t) => t + 1)
  }, [])
  return { ...state, reload }
}
