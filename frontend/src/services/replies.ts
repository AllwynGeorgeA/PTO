import { isAxiosError } from 'axios'
import type { AiReply, ReplyTone, ReplyUsage } from '../types'
import type { ReplyUpdate } from '../types/replies'
import api from './api'

export const generateReply = (message: string, tone: ReplyTone, includeAvailability = false) =>
  api
    .post<AiReply>('/replies/generate', { message, tone, include_availability: includeAvailability })
    .then((r) => r.data)
export const regenerateReply = (id: number) => api.post<AiReply>(`/replies/${id}/regenerate`).then((r) => r.data)
export const updateReply = (id: number, body: ReplyUpdate) => api.put<AiReply>(`/replies/${id}`, body).then((r) => r.data)
export const listReplies = (saved?: boolean) =>
  api.get<AiReply[]>('/replies', { params: saved ? { saved: true } : undefined }).then((r) => r.data)
export const deleteReply = (id: number) => api.delete(`/replies/${id}`).then(() => undefined)
export const getReplyUsage = () => api.get<ReplyUsage>('/replies/usage').then((r) => r.data)

export const isLimitReached = (e: unknown): boolean => isAxiosError(e) && e.response?.status === 402

export function errorMessage(e: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (isAxiosError<{ detail?: unknown }>(e)) {
    const d = e.response?.data?.detail
    if (typeof d === 'string') return d
  }
  return fallback
}
