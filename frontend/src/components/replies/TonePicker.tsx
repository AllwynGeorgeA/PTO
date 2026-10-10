import { Box, SimpleGrid, Text } from '@chakra-ui/react'
import { useId } from 'react'
import { useMotionOk } from '../../hooks/useMotion'
import { MotionBox } from '../../lib/motion'
import type { ReplyTone } from '../../types'
import { TONE_OPTIONS } from '../../types/replies'

// Radio group of tones: a pill slides to the selection and the emoji wiggles.
export function TonePicker({ value, onChange }: { value: ReplyTone; onChange: (t: ReplyTone) => void }) {
  const groupId = useId()
  const ok = useMotionOk()
  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3" role="radiogroup" aria-label="Reply tone">
      {TONE_OPTIONS.map((t) => {
        const selected = t.value === value
        return (
          <MotionBox
            as="button"
            key={t.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(t.value)}
            position="relative"
            textAlign="left"
            p="3"
            minH="11"
            rounded="xl"
            borderWidth="2px"
            borderColor={selected ? 'brand.solid' : 'border'}
            bg="surface"
            cursor="pointer"
            whileHover={ok ? { y: -3, rotate: -0.6 } : undefined}
            whileTap={ok ? { scale: 0.96 } : undefined}
          >
            {selected && (
              <MotionBox
                layoutId={ok ? `tone-pill-${groupId}` : undefined}
                position="absolute"
                inset="0"
                rounded="lg"
                bg="brand.subtle"
                zIndex="0"
                aria-hidden="true"
              />
            )}
            <Box position="relative" zIndex="1">
              <Text fontWeight="semibold">
                <MotionBox
                  as="span"
                  display="inline-block"
                  animate={selected && ok ? { rotate: [0, -14, 14, -8, 0], scale: [1, 1.25, 1] } : { rotate: 0, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {t.emoji}
                </MotionBox>{' '}
                {t.label}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {t.hint}
              </Text>
            </Box>
          </MotionBox>
        )
      })}
    </SimpleGrid>
  )
}
