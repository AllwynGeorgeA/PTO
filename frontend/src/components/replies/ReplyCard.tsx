import { Badge, Button, HStack, Text, Textarea } from '@chakra-ui/react'
import { useState } from 'react'
import { canShare, shareText } from '../../lib/clipboard'
import type { AiReply } from '../../types'
import { TONE_OPTIONS } from '../../types/replies'
import { CopyButton } from '../ui/CopyButton'
import { GlassCard } from '../ui/GlassCard'

interface Props {
  reply: AiReply
  onEdit: (text: string) => Promise<void>
  onToggleSave?: () => void
  onRegenerate?: () => void
  onDelete?: () => void
  busy?: boolean
}

export function ReplyCard({ reply, onEdit, onToggleSave, onRegenerate, onDelete, busy }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(reply.generated_reply)
  const tone = TONE_OPTIONS.find((t) => t.value === reply.tone)

  const save = async () => {
    if (!draft.trim()) return
    await onEdit(draft.trim())
    setEditing(false)
  }

  return (
    <GlassCard>
      <HStack mb="2" wrap="wrap" gap="2">
        <Badge colorPalette="teal">
          {tone?.emoji} {tone?.label ?? reply.tone}
        </Badge>
        {reply.source === 'template' && <Badge variant="subtle">Template reply</Badge>}
      </HStack>
      <Text fontSize="sm" color="fg.muted" mb="3">
        Re: {reply.incoming_message}
      </Text>
      {editing ? (
        <>
          <Textarea aria-label="Edit reply" value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} mb="3" />
          <HStack>
            <Button size="sm" rounded="full" onClick={save} disabled={busy || !draft.trim()}>
              Save edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(reply.generated_reply)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
          </HStack>
        </>
      ) : (
        <>
          <Text whiteSpace="pre-wrap" mb="4">
            {reply.generated_reply}
          </Text>
          <HStack wrap="wrap" gap="2">
            <CopyButton text={reply.generated_reply} />
            {canShare() && (
              <Button size="sm" variant="outline" rounded="full" onClick={() => void shareText(reply.generated_reply)}>
                📤 Share
              </Button>
            )}
            <Button size="sm" variant="outline" rounded="full" onClick={() => setEditing(true)}>
              ✏️ Edit
            </Button>
            {onRegenerate && (
              <Button size="sm" variant="outline" rounded="full" onClick={onRegenerate} disabled={busy}>
                🔄 Regenerate
              </Button>
            )}
            {onToggleSave && (
              <Button size="sm" rounded="full" onClick={onToggleSave} disabled={busy}>
                {reply.is_saved ? '⭐ Saved' : '☆ Save'}
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="ghost" colorPalette="red" onClick={onDelete} disabled={busy}>
                🗑️ Delete
              </Button>
            )}
          </HStack>
        </>
      )}
    </GlassCard>
  )
}
