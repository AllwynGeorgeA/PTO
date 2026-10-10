import { Heading } from '@chakra-ui/react'
import { useRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useMotionOk } from '../../hooks/useMotion'
import { MotionBox } from '../../lib/motion'
import { useFun } from '../../hooks/useFun'

// Mascot + name. Easter egg: five quick clicks start an emoji shower.
export function Logo({ to }: { to: string }) {
  const { shower } = useFun()
  const ok = useMotionOk()
  const clicks = useRef<number[]>([])

  const onClick = () => {
    const now = Date.now()
    clicks.current = [...clicks.current.filter((t) => now - t < 3000), now]
    if (clicks.current.length >= 5) {
      clicks.current = []
      shower()
    }
  }

  return (
    <Heading size="lg" color="brand.fg" asChild>
      <RouterLink to={to} onClick={onClick} aria-label="PTOShield AI home">
        <MotionBox
          as="span"
          display="inline-block"
          mr="2"
          aria-hidden="true"
          whileHover={ok ? { rotate: [0, -15, 15, -10, 10, 0] } : undefined}
          whileTap={ok ? { scale: 0.8 } : undefined}
        >
          🦥
        </MotionBox>
        PTOShield AI
      </RouterLink>
    </Heading>
  )
}
