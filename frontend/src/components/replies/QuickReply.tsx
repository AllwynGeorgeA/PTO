import { CloseButton, Dialog, Portal, Stack, Text, Textarea } from '@chakra-ui/react'
import { useState } from 'react'
import { useMotionOk } from '../../hooks/useMotion'
import { useReplyPrefs } from '../../hooks/useReplyPrefs'
import { OOPS } from '../../lib/fun'
import { MotionButton } from '../../lib/motion'
import { errorMessage, generateReply, isLimitReached } from '../../services/replies'
import { CopyButton } from '../ui/CopyButton'
import { LoadingNote } from '../ui/LoadingNote'
import { ReplyComposer } from './ReplyComposer'
import { UpgradePrompt } from './UpgradePrompt'

// Floating "Quick reply" button + dialog: paste, pick tone, generate, copy.
export function QuickReply() {
  const ok = useMotionOk()
  const prefs = useReplyPrefs()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState<string | null>(null)

  const generate = async () => {
    setBusy(true)
    setError(null)
    setLimit(null)
    try {
      const r = await generateReply(message.trim(), prefs.tone, prefs.includeAvailability)
      setReply(r.generated_reply)
    } catch (e) {
      if (isLimitReached(e)) setLimit(errorMessage(e, ''))
      else setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="center" scrollBehavior="inside" size="lg">
      <Dialog.Trigger asChild>
        <MotionButton
          position="fixed"
          right={{ base: '4', md: '8' }}
          bottom={{ base: '20', md: '8' }}
          zIndex="sticky"
          rounded="full"
          minH="12"
          px="5"
          shadow="md"
          colorPalette="accent"
          aria-label="Quick reply"
          whileHover={ok ? { scale: 1.08, rotate: -3 } : undefined}
          whileTap={ok ? { scale: 0.92 } : undefined}
          animate={ok ? { y: [0, -4, 0] } : undefined}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          ✉️ Quick reply
        </MotionButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>✉️ Quick reply</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="4">
                <ReplyComposer
                  message={message}
                  onMessage={setMessage}
                  tone={prefs.tone}
                  onTone={prefs.setTone}
                  includeAvailability={prefs.includeAvailability}
                  onInclude={prefs.setIncludeAvailability}
                  busy={busy}
                  onSubmit={() => void generate()}
                  rows={3}
                />
                {busy && <LoadingNote rows={1} line="Asking the AI to stall your boss…" />}
                {error && (
                  <Text role="alert" color="accent.fg">
                    {OOPS} {error}
                  </Text>
                )}
                {limit !== null && <UpgradePrompt message={limit || undefined} />}
                {reply && !busy && (
                  <Stack gap="3">
                    <Textarea aria-label="Generated reply" value={reply} onChange={(e) => setReply(e.target.value)} rows={5} />
                    <CopyButton text={reply} />
                  </Stack>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton aria-label="Close quick reply" size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
