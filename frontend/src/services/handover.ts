import type { HandoverSummary, HandoverTask, HandoverTaskInput } from '../types'
import api from './api'

export const listTasks = () => api.get<HandoverTask[]>('/handover-tasks').then((r) => r.data)
export const getTask = (id: number) => listTasks().then((all) => all.find((t) => t.id === id) ?? null)
export const createTask = (body: HandoverTaskInput) => api.post<HandoverTask>('/handover-tasks', body).then((r) => r.data)
export const updateTask = (id: number, body: HandoverTaskInput) =>
  api.put<HandoverTask>(`/handover-tasks/${id}`, body).then((r) => r.data)
export const deleteTask = (id: number) => api.delete(`/handover-tasks/${id}`).then(() => undefined)
export const toggleTask = (id: number) => api.post<HandoverTask>(`/handover-tasks/${id}/toggle`).then((r) => r.data)
export const generateSummary = (ptoPlanId?: number) =>
  api
    .post<HandoverSummary>('/handover-tasks/summary', ptoPlanId ? { pto_plan_id: ptoPlanId } : {})
    .then((r) => r.data)
