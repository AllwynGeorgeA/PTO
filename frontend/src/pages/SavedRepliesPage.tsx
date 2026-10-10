import { Button, Heading, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ReplyCard } from '../components/replies/ReplyCard'
import { AnimatedList } from '../components/ui/AnimatedList'
import { GlassCard } from '../components/ui/GlassCard'
import { useSavedReplies } from '../hooks/useReplies'
import { deleteReply, errorMessage, updateReply } from '../services/replies'

export default function SavedRepliesPage() {
  const { data, loading, error, reload } = useSavedReplies()
  const [actionError, setActionError] = useState<string | null>(null)

  const guard = async (fn: () => Promise<void>) => {
    setActionError(null)
    try {
      await fn()
      reload()
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  const shownError = error ?? actionError
  return (
    <PageWrapper>
      <Stack gap="5" maxW="3xl">
        <Heading size="xl">⭐ Saved Replies</Heading>
        {loading && <Text color="fg.muted">Loading your finest excuses...</Text>}
        {shownError && (
          <Text role="alert" color="red.500">
            {shownError}
          </Text>
        )}
        {!loading && !error && data.length === 0 && (
          <GlassCard>
            <Text mb="3">No saved replies yet. Your inbox is safe, but your future self is unprepared.</Text>
            <Button asChild rounded="full">
              <Link to="/replies/new">Generate one</Link>
            </Button>
          </GlassCard>
        )}
        <AnimatedList>
          {data.map((r) => (
            <ReplyCard
              key={`${r.id}-${r.generated_reply}`}
              reply={r}
              onEdit={(t) => updateReply(r.id, { generated_reply: t }).then(reload)}
              onDelete={() => void guard(() => deleteReply(r.id))}
            />
          ))}
        </AnimatedList>
      </Stack>
    </PageWrapper>
  )
}
