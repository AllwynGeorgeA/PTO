import { Badge, Button, Heading, HStack, Stack, Text, Textarea } from '@chakra-ui/react'
import { useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ReplyCard } from '../components/replies/ReplyCard'
import { TonePicker } from '../components/replies/TonePicker'
import { UpgradePrompt } from '../components/replies/UpgradePrompt'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { useReplyUsage } from '../hooks/useReplies'
import { errorMessage, generateReply, isLimitReached, regenerateReply, updateReply } from '../services/replies'
import type { AiReply, ReplyTone } from '../types'
import { EXAMPLE_MESSAGES, type ReplyUpdate } from '../types/replies'

export default function ReplyGeneratorPage() {
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<ReplyTone>('professional')
  const [reply, setReply] = useState<AiReply | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState<string | null>(null)
  const usage = useReplyUsage()
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
      setReply(await updateReply(reply.id, body))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageWrapper>
      <Stack gap="5" maxW="3xl">
        <HStack justify="space-between" wrap="wrap">
          <Heading size="xl">✉️ Auto-Reply Generator</Heading>
          {u && (
            <Badge size="lg" colorPalette={u.limit !== null && u.used >= u.limit ? 'red' : 'teal'}>
              {u.limit === null ? 'Unlimited replies' : `${u.used}/${u.limit} free replies used this month`}
            </Badge>
          )}
        </HStack>
        <GlassCard>
          <Stack gap="4">
            <Text fontWeight="semibold">What did your colleague just send?</Text>
            <Textarea
              aria-label="Colleague message"
              placeholder="Paste the message you are definitely not answering on vacation..."
              value={message}
              maxLength={2000}
              rows={4}
              onChange={(e) => setMessage(e.target.value)}
            />
            <HStack wrap="wrap" gap="2" aria-label="Example messages">
              {EXAMPLE_MESSAGES.map((m) => (
                <Button key={m} size="xs" variant="subtle" rounded="full" onClick={() => setMessage(m)}>
                  {m}
                </Button>
              ))}
            </HStack>
            <Text fontWeight="semibold">Pick your tone</Text>
            <TonePicker value={tone} onChange={setTone} />
            <GradientButton
              alignSelf="flex-start"
              disabled={busy || !message.trim()}
              loading={busy && !reply}
              onClick={() => void run(() => generateReply(message.trim(), tone))}
            >
              ✨ Generate reply
            </GradientButton>
          </Stack>
        </GlassCard>
        {error && (
          <Text role="alert" color="red.500">
            {error}
          </Text>
        )}
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
