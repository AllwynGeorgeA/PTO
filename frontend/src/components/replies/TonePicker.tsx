import { Box, SimpleGrid, Text } from '@chakra-ui/react'
import type { ReplyTone } from '../../types'
import { TONE_OPTIONS } from '../../types/replies'

export function TonePicker({ value, onChange }: { value: ReplyTone; onChange: (t: ReplyTone) => void }) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3" role="radiogroup" aria-label="Reply tone">
      {TONE_OPTIONS.map((t) => {
        const selected = t.value === value
        return (
          <Box
            asChild
            key={t.value}
            textAlign="left"
            p="3"
            rounded="xl"
            borderWidth="2px"
            borderColor={selected ? 'brand.solid' : 'border'}
            bg={selected ? 'brand.subtle' : 'surface'}
            cursor="pointer"
          >
            <button type="button" role="radio" aria-checked={selected} onClick={() => onChange(t.value)}>
              <Text fontWeight="semibold">
                {t.emoji} {t.label}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {t.hint}
              </Text>
            </button>
          </Box>
        )
      })}
    </SimpleGrid>
  )
}
