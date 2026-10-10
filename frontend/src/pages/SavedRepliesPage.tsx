import { Heading, Stack } from '@chakra-ui/react'
import { useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ReplyCard } from '../components/replies/ReplyCard'
import { AnimatedList } from '../components/ui/AnimatedList'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorNote } from '../components/ui/ErrorNote'
import { LoadingNote } from '../components/ui/LoadingNote'
import { toastOk } from '../lib/toast'
import { useSavedReplies } from '../hooks/useReplies'
import { deleteReply, errorMessage, updateReply } from '../services/replies'

export default function SavedRepliesPage() {
  const { data, loading, error, reload } = useSavedReplies()
  const [actionError, setActionError] = useState<string | null>(null)

  const guard = async (fn: () => Promise<void>) => {
    setActionError(null)
    try {
      await fn()
      toastOk('Gone. Your boss will never know. 🕶️')
      reload()
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  const shownError = error ?? actionError
  return (
    <PageWrapper>
      <Stack gap="5" maxW="3xl">
        <Heading size="2xl">⭐ Your finest excuses</Heading>
        {loading && data.length === 0 && <LoadingNote rows={2} line="Loading your finest excuses…" />}
        {shownError && <ErrorNote message={shownError} onRetry={reload} />}
        {!loading && !error && data.length === 0 && (
          <EmptyState
            emoji="🫙"
            title="The excuse jar is empty"
            text="Your inbox is safe, but your future self is unprepared."
            to="/replies/new"
            cta="Generate one ✨"
          />
        )}
        <AnimatedList>
          {data.map((r) => (
            <ReplyCard
              key={`${r.id}-${r.generated_reply}`}
              reply={r}
              onEdit={(t) => updateReply(r.id, { generated_reply: t }).then(reload)}
              onDelete={() => {
                if (window.confirm('Delete this reply? It was a good one. 😢')) void guard(() => deleteReply(r.id))
              }}
            />
          ))}
        </AnimatedList>
      </Stack>
    </PageWrapper>
  )
}
