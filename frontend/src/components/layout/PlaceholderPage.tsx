import { Heading, Text } from '@chakra-ui/react'
import { GlassCard } from '../ui/GlassCard'
import { PageWrapper } from './PageWrapper'

export function PlaceholderPage({ title, emoji = '🏝️' }: { title: string; emoji?: string }) {
  return (
    <PageWrapper>
      <GlassCard>
        <Heading size="xl" mb="2">
          {emoji} {title}
        </Heading>
        <Text color="fg.muted">Coming soon. Your PTO is approved, this page is still on vacation.</Text>
      </GlassCard>
    </PageWrapper>
  )
}
