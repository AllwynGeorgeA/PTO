import { useCallback } from 'react'
import { ptoService } from '../services/ptoService'
import type { PtoPlan } from '../types'
import { useAsync } from './useAsync'

const empty: PtoPlan[] = []

export function usePtoPlans() {
  const { data, loading, error, reload } = useAsync(ptoService.list, empty)
  return { plans: data, loading, error, reload }
}

export function usePtoPlan(id: number | null) {
  const load = useCallback(() => ptoService.get(id as number), [id])
  const { data, loading, error } = useAsync<PtoPlan | null>(id === null ? null : load, null)
  return { plan: data, loading, error }
}
