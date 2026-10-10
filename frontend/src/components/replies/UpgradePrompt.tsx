import { Button, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../ui/GlassCard'

export function UpgradePrompt({ message }: { message?: string }) {
  return (
    <GlassCard role="alert" borderColor="sunset.400">
      <Text fontWeight="bold" mb="1">
        🚧 You have hit your free reply limit
      </Text>
      <Text color="fg.muted" mb="3">
        {message ?? 'Your 5 free AI replies are used up. Upgrade to keep your out-of-office game strong.'}
      </Text>
      <Button asChild rounded="full" colorPalette="orange">
        <Link to="/pricing">Upgrade to Pro</Link>
      </Button>
    </GlassCard>
  )
}
