import api from './api'
import type { DashboardData } from '../types'

export const dashboardService = {
  get: async (): Promise<DashboardData> => (await api.get<DashboardData>('/dashboard')).data,
}
