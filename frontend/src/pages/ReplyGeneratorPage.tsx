import { Badge, Button, Heading, HStack, Stack } from '@chakra-ui/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ReplyCard } from '../components/replies/ReplyCard'
import { ReplyComposer } from '../components/replies/ReplyComposer'
import { UpgradePrompt } from '../components/replies/UpgradePrompt'
import { Card } from '../components/ui/Card'
import { ErrorNote } from '../components/ui/ErrorNote'
import { useFun } from '../hooks/useFun'
import { LoadingNote } from '../components/ui/LoadingNote'
import { toastOk } from '../lib/toast'
import { useReplyPrefs } from '../hooks/useReplyPrefs'
import { useReplyUsage } from '../hooks/useReplies'
import { errorMessage, generateReply, isLimitReached, regenerateReply, updateReply } from '../services/replies'
import type { AiReply } from '../types'
import type { ReplyUpdate } from '../types/replies'

export default function ReplyGeneratorPage() {
  const [message, setMessage] = useState('')
  const prefs = useReplyPrefs()
  const [reply, setReply] = useState<AiReply | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState<string | null>(null)
  const usage = useReplyUsage()
  const { burst } = useFun()
  const u = usage.data

  const run = async (fn: () => Promise<AiReply>) => {
    setBusy(true)
    setError(null)
    setLimit(null)
    try {
      setReply(await fn())
      usage.reload()
    } catch (e) {
      if (isLimitReached(e)) setLimit(errorMessage(e, ''))
      else setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const patch = async (body: ReplyUpdate) => {
    if (!reply) return
    setBusy(true)
    try {
      const updated = await updateReply(reply.id, body)
      setReply(updated)
      if (body.is_saved === true) {
        burst()
        toastOk('Saved! Future you says thanks ⭐')
      }
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const generate = () => void run(() => generateReply(message.trim(), prefs.tone, prefs.includeAvailability))

  return (
    <PageWrapper>
      <Stack gap="5" maxW="3xl">
        <HStack justify="space-between" wrap="wrap">
          <Heading size="2xl">✉️ Excuse generator</Heading>
          <HStack>
            {u && (
              <Badge size="lg" colorPalette={u.limit !== null && u.used >= u.limit ? 'accent' : 'brand'}>
                {u.limit === null ? 'Unlimited replies ♾️' : `${u.used}/${u.limit} free replies used this month`}
              </Badge>
            )}
            <Button asChild variant="outline" rounded="full" size="sm" minH="11">
              <Link to="/replies">⭐ Saved</Link>
            </Button>
          </HStack>
        </HStack>
        <Card>
          <ReplyComposer
            message={message}
            onMessage={setMessage}
            tone={prefs.tone}
            onTone={prefs.setTone}
            includeAvailability={prefs.includeAvailability}
            onInclude={prefs.setIncludeAvailability}
            busy={busy}
            onSubmit={generate}
          />
        </Card>
        {busy && !reply && <LoadingNote rows={1} line="Asking the AI to stall your boss…" />}
        {error && <ErrorNote message={error} />}
        {limit !== null && <UpgradePrompt message={limit || undefined} />}
        {reply && (
          <ReplyCard
            key={`${reply.id}-${reply.generated_reply}`}
            reply={reply}
            busy={busy}
            onEdit={(t) => patch({ generated_reply: t })}
            onToggleSave={() => void patch({ is_saved: !reply.is_saved })}
            onRegenerate={() => void run(() => regenerateReply(reply.id))}
          />
        )}
      </Stack>
    </PageWrapper>
  )
}
