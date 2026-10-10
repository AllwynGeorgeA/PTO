import { Heading, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { useMotionOk } from '../../hooks/useMotion'
import { MotionBox } from '../../lib/motion'
import { Card } from './Card'
import { PrimaryButton } from './PrimaryButton'

interface Props {
  emoji: string
  title: string
  text: string
  to: string
  cta: string
}

// Friendly empty state with exactly one call to action.
export function EmptyState({ emoji, title, text, to, cta }: Props) {
  const ok = useMotionOk()
  return (
    <Card textAlign="center" py="12">
      <MotionBox
        aria-hidden="true"
        fontSize="5xl"
        display="inline-block"
        animate={ok ? { y: [0, -10, 0] } : undefined}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {emoji}
      </MotionBox>
      <Heading size="lg" mt="2" mb="2">
        {title}
      </Heading>
      <Text color="fg.muted" mb="5">
        {text}
      </Text>
      <PrimaryButton asChild>
        <Link to={to}>{cta}</Link>
      </PrimaryButton>
    </Card>
  )
}
