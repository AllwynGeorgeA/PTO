import { Button, Flex, Heading, SimpleGrid, Skeleton, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ReadinessMeter } from '../components/pto/ReadinessMeter'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { useDashboard } from '../hooks/useDashboard'
import { countdownText, formatDate } from '../lib/pto'

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <GlassCard>
      <Text color="fg.muted" fontSize="sm">
        {label}
      </Text>
      <Heading size="2xl">{value}</Heading>
      {hint && <Text color="fg.muted">{hint}</Text>}
    </GlassCard>
  )
}

export default function DashboardPage() {
  const { data, loading, error } = useDashboard()

  return (
    <PageWrapper>
      <Heading size="2xl" mb="6">
        🏝️ Dashboard
      </Heading>
      {error && (
        <Text role="alert" color="red.500" mb="4">
          {error}
        </Text>
      )}
      {loading && <Skeleton height="200px" borderRadius="card" />}
      {data && (
        <>
          {data.next_pto === null ? (
            <GlassCard textAlign="center" py="10" mb="6">
              <Heading size="lg" mb="2">
                No vacation planned yet 🌴
              </Heading>
              <Text color="fg.muted" mb="5">
                Plan your PTO and we will help you protect your peace.
              </Text>
              <GradientButton asChild>
                <RouterLink to="/pto/new">Plan PTO</RouterLink>
              </GradientButton>
            </GlassCard>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="4" mb="6">
              <Stat
                label="Next vacation"
                value={data.days_remaining === null ? '-' : countdownText(data.next_pto.status, data.days_remaining)}
                hint={`${formatDate(data.next_pto.start_date)} to ${formatDate(data.next_pto.end_date)}`}
              />
              <Stat label="Saved AI replies" value={String(data.saved_reply_count)} />
              <Stat label="Pending handover tasks" value={String(data.pending_task_count)} />
            </SimpleGrid>
          )}

          <GlassCard mb="6">
            <ReadinessMeter score={data.readiness_score} message={data.readiness_message} />
          </GlassCard>

          <Flex gap="3" wrap="wrap">
            <Button asChild colorPalette="brand">
              <RouterLink to="/pto/new">Plan PTO</RouterLink>
            </Button>
            <Button asChild colorPalette="brand" variant="outline">
              <RouterLink to="/replies/new">Generate reply</RouterLink>
            </Button>
            <Button asChild colorPalette="brand" variant="outline">
              <RouterLink to="/handover/new">Add handover task</RouterLink>
            </Button>
          </Flex>
        </>
      )}
    </PageWrapper>
  )
}
