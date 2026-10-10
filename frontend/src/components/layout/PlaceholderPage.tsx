import { Heading, Text } from '@chakra-ui/react'
import { Card } from '../ui/Card'
import { PageWrapper } from './PageWrapper'

export function PlaceholderPage({ title, emoji = '🏝️' }: { title: string; emoji?: string }) {
  return (
    <PageWrapper>
      <Card>
        <Heading size="xl" mb="2">
          {emoji} {title}
        </Heading>
        <Text color="fg.muted">Coming soon. Your PTO is approved, this page is still on vacation.</Text>
      </Card>
    </PageWrapper>
  )
}
