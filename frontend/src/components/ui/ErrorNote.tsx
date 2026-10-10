import { Button, Stack, Text } from '@chakra-ui/react'
import { OOPS } from '../../lib/fun'

// Inline error: funny headline, real message underneath, optional retry.
export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Stack role="alert" gap="1" p="4" borderRadius="card" bg="accent.subtle" borderWidth="1px" borderColor="accent.border">
      <Text fontWeight="semibold" color="accent.fg">
        {OOPS}
      </Text>
      <Text color="accent.fg" fontSize="sm">
        {message}
      </Text>
      {onRetry && (
        <Button alignSelf="flex-start" size="sm" mt="1" rounded="full" colorPalette="accent" variant="outline" onClick={onRetry}>
          Try again 🔄
        </Button>
      )}
    </Stack>
  )
}
