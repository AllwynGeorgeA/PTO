import { Heading, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { useMotionOk } from '../hooks/useMotion'
import { NOT_FOUND_JOKES, pick } from '../lib/fun'
import { MotionBox } from '../lib/motion'

export default function NotFoundPage() {
  const ok = useMotionOk()
  const [joke] = useState(() => pick(NOT_FOUND_JOKES))
  return (
    <Stack align="center" textAlign="center" gap="4" pt="16">
      <MotionBox
        fontSize="8xl"
        aria-hidden="true"
        animate={ok ? { rotate: [0, -10, 10, -10, 0] } : undefined}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🦥
      </MotionBox>
      <Heading size="4xl">404</Heading>
      <Text fontSize="xl" maxW="md">
        {joke}
      </Text>
      <PrimaryButton asChild size="lg">
        <Link to="/">Take me home 🏠</Link>
      </PrimaryButton>
    </Stack>
  )
}
