import { useCallback } from 'react'
import type { HandoverTask } from '../types'
import { getTask, listTasks } from '../services/handover'
import { useAsync } from './useAsync'

const noTasks: HandoverTask[] = []

export const useTasks = () => useAsync<HandoverTask[]>(listTasks, noTasks)

export function useTask(id: number | null) {
  const load = useCallback(() => getTask(id as number), [id])
  return useAsync<HandoverTask | null>(id === null ? null : load, null)
}
