import { Skeleton, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { LOADING_LINES, pick } from '../../lib/fun'

// Skeleton blocks plus one joke while data loads.
export function LoadingNote({ rows = 2, line }: { rows?: number; line?: string }) {
  const [text] = useState(() => line ?? pick(LOADING_LINES))
  return (
    <Stack role="status" gap="3">
      <Text color="fg.muted">{text}</Text>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height="88px" borderRadius="card" />
      ))}
    </Stack>
  )
}
