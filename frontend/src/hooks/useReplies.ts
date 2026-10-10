import type { AiReply, ReplyUsage } from '../types'
import { getReplyUsage, listReplies } from '../services/replies'
import { useAsync } from './useAsync'

const noReplies: AiReply[] = []
const loadSaved = () => listReplies(true)

export const useSavedReplies = () => useAsync<AiReply[]>(loadSaved, noReplies)
export const useReplyUsage = () => useAsync<ReplyUsage | null>(getReplyUsage, null)
