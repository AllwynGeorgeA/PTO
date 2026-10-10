import { dashboardService } from '../services/dashboardService'
import type { DashboardData } from '../types'
import { useAsync } from './useAsync'

export function useDashboard() {
  const { data, loading, error, reload } = useAsync<DashboardData | null>(dashboardService.get, null)
  return { data, loading, error, reload }
}
