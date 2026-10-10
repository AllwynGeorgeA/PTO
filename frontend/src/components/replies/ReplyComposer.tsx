import { Button, Checkbox, HStack, Stack, Text, Textarea } from '@chakra-ui/react'
import type { KeyboardEvent } from 'react'
import type { ReplyTone } from '../../types'
import { EXAMPLE_MESSAGES } from '../../types/replies'
import { PrimaryButton } from '../ui/PrimaryButton'
import { TonePicker } from './TonePicker'

interface Props {
  message: string
  onMessage: (m: string) => void
  tone: ReplyTone
  onTone: (t: ReplyTone) => void
  includeAvailability: boolean
  onInclude: (v: boolean) => void
  busy: boolean
  onSubmit: () => void
  rows?: number
}

// Shared form for the reply page and the Quick reply panel. Ctrl+Enter generates.
export function ReplyComposer({ message, onMessage, tone, onTone, includeAvailability, onInclude, busy, onSubmit, rows = 4 }: Props) {
  const canSubmit = !busy && message.trim() !== ''
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (canSubmit) onSubmit()
    }
  }

  return (
    <Stack gap="4">
      <Text fontWeight="semibold" id="composer-label">
        What did your colleague just send?
      </Text>
      <Textarea
        aria-label="Colleague message"
        placeholder="Paste the message you are definitely not answering on vacation..."
        value={message}
        maxLength={2000}
        rows={rows}
        onChange={(e) => onMessage(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <HStack wrap="wrap" gap="2" role="group" aria-label="Example messages">
        {EXAMPLE_MESSAGES.map((m) => (
          <Button key={m} size="xs" variant="subtle" rounded="full" h="auto" py="1.5" whiteSpace="normal" textAlign="left" onClick={() => onMessage(m)}>
            💬 {m}
          </Button>
        ))}
      </HStack>
      <Text fontWeight="semibold">Pick your tone</Text>
      <TonePicker value={tone} onChange={onTone} />
      <Checkbox.Root checked={includeAvailability} onCheckedChange={(e) => onInclude(e.checked === true)}>
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>Include my backup + return date 🗓️</Checkbox.Label>
      </Checkbox.Root>
      <HStack gap="3" wrap="wrap">
        <PrimaryButton disabled={!canSubmit} loading={busy} onClick={onSubmit}>
          ✨ Generate reply
        </PrimaryButton>
        <Text fontSize="sm" color="fg.muted">
          or press Ctrl+Enter ⌨️
        </Text>
      </HStack>
    </Stack>
  )
}
