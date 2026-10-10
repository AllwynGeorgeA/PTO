import api from './api'
import type { PtoPlan, PtoPlanInput } from '../types'

export const ptoService = {
  list: async (): Promise<PtoPlan[]> => (await api.get<PtoPlan[]>('/pto-plans')).data,
  get: async (id: number): Promise<PtoPlan> => (await api.get<PtoPlan>(`/pto-plans/${id}`)).data,
  create: async (input: PtoPlanInput): Promise<PtoPlan> => (await api.post<PtoPlan>('/pto-plans', input)).data,
  update: async (id: number, input: PtoPlanInput): Promise<PtoPlan> =>
    (await api.put<PtoPlan>(`/pto-plans/${id}`, input)).data,
  remove: async (id: number): Promise<void> => {
    await api.delete(`/pto-plans/${id}`)
  },
}
