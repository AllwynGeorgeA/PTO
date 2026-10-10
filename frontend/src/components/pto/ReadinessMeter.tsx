import { Box, Heading, Progress, Text, VisuallyHidden } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'
import { useCountUp, useMotionOk } from '../../hooks/useMotion'
import { readinessTier } from '../../lib/pto'
import { MotionBox } from '../../lib/motion'
import { useFun } from '../../hooks/useFun'

// Animated score: counts up, emoji pops when the tier changes, bursts at 100%.
export function ReadinessMeter({ score, message }: { score: number; message: string }) {
  const tier = readinessTier(score)
  const shown = useCountUp(score)
  const ok = useMotionOk()
  const { burst } = useFun()
  const celebrated = useRef(false)

  useEffect(() => {
    if (score >= 100 && !celebrated.current) {
      celebrated.current = true
      burst()
    }
  }, [score, burst])

  return (
    <Box data-testid="readiness">
      <Heading size="md" mb="3">
        Vacation Readiness Score
      </Heading>
      <Heading size="4xl" mb="2" display="flex" alignItems="center" gap="3">
        <MotionBox
          key={tier.emoji}
          as="span"
          aria-hidden="true"
          initial={ok ? { scale: 0, rotate: -40 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 12 }}
        >
          {tier.emoji}
        </MotionBox>
        <Box as="span" aria-hidden="true" color={`${tier.color}.fg`}>
          {shown}%
        </Box>
        <VisuallyHidden>{score}%</VisuallyHidden>
      </Heading>
      <Progress.Root value={shown} max={100} colorPalette={tier.color} aria-label="Vacation readiness score" size="lg">
        <Progress.Track rounded="full">
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
      <Text mt="3" fontWeight="semibold">
        {tier.label}
      </Text>
      <Text color="fg.muted">{message}</Text>
    </Box>
  )
}
