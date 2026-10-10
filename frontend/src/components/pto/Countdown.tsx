import { Box, Heading } from '@chakra-ui/react'
import { useCountUp, useMotionOk } from '../../hooks/useMotion'
import { unreachableText } from '../../lib/fun'
import { MotionBox } from '../../lib/motion'
import type { PtoStatus } from '../../types'

interface Props {
  status: PtoStatus
  daysRemaining: number
  dayNumber?: number
}

// Big flip-in number counting up to the days left, with a funny caption.
export function Countdown({ status, daysRemaining, dayNumber }: Props) {
  const ok = useMotionOk()
  const big = status === 'upcoming' ? Math.max(daysRemaining, 0) : status === 'active' ? (dayNumber ?? 1) : 0
  const shown = useCountUp(big, 1.1)
  const caption = unreachableText(status, daysRemaining, dayNumber)

  return (
    <Box textAlign="center" data-testid="countdown">
      {status !== 'completed' && (
        <MotionBox
          aria-hidden="true"
          display="inline-block"
          fontSize={{ base: '7xl', md: '8xl' }}
          fontWeight="extrabold"
          lineHeight="1"
          color="brand.fg"
          initial={ok ? { rotateX: -90, opacity: 0, transformPerspective: 600 } : false}
          animate={{ rotateX: 0, opacity: 1, transformPerspective: 600 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        >
          {shown}
        </MotionBox>
      )}
      <Heading size="lg" mt="2">
        {caption}
      </Heading>
    </Box>
  )
}
