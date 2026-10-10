import { Box, Button, Flex, Heading, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react'
import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { DemoInbox } from '../components/dashboard/DemoInbox'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Countdown } from '../components/pto/Countdown'
import { NextStepCard } from '../components/pto/NextStepCard'
import { ReadinessMeter } from '../components/pto/ReadinessMeter'
import { Card } from '../components/ui/Card'
import { ErrorNote } from '../components/ui/ErrorNote'
import { useDashboard } from '../hooks/useDashboard'
import { useTasks } from '../hooks/useHandover'
import { useReplyUsage } from '../hooks/useReplies'
import { daysUntil } from '../lib/format'
import { greeting } from '../lib/fun'
import { SHOW_DEMO } from '../lib/demo'
import { buildSteps } from '../lib/steps'
import { formatDate } from '../lib/pto'

function Stat({ emoji, label, value, to }: { emoji: string; label: string; value: number; to: string }) {
  return (
    <Card asChild p="4" _hover={{ borderColor: 'brand.border' }}>
      <RouterLink to={to} aria-label={`${label}: ${value}`}>
        <Text fontSize="2xl" aria-hidden="true">
          {emoji}
        </Text>
        <Heading size="2xl">{value}</Heading>
        <Text color="fg.muted" fontSize="sm">
          {label}
        </Text>
      </RouterLink>
    </Card>
  )
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useDashboard()
  const tasks = useTasks()
  const usage = useReplyUsage()
  const steps = useMemo(
    () => (data ? buildSteps(data, tasks.data.length, usage.data?.used ?? 0) : []),
    [data, tasks.data.length, usage.data?.used],
  )
  const stepsLoading = tasks.loading || usage.loading

  return (
    <PageWrapper>
      <Stack gap="6">
        <Heading size="2xl">{data ? greeting(data.readiness_score, data.days_remaining) : '🏝️ Your escape HQ'}</Heading>
        {error && <ErrorNote message={error} onRetry={reload} />}
        {loading && <Skeleton height="200px" borderRadius="card" />}
        {data && (
          <>
            <Card textAlign="center" py="8">
              {data.next_pto === null || data.days_remaining === null ? (
                <Stack gap="2">
                  <Text fontSize="5xl" aria-hidden="true">
                    🌴
                  </Text>
                  <Heading size="lg">No vacation planned yet</Heading>
                  <Text color="fg.muted">Your inbox thinks you love it here. Let&apos;s fix that.</Text>
                </Stack>
              ) : (
                <>
                  <Countdown
                    status={data.next_pto.status}
                    daysRemaining={data.days_remaining}
                    dayNumber={1 - daysUntil(data.next_pto.start_date)}
                  />
                  <Text color="fg.muted" mt="1">
                    {formatDate(data.next_pto.start_date)} to {formatDate(data.next_pto.end_date)}
                  </Text>
                </>
              )}
            </Card>

            {stepsLoading ? <Skeleton height="260px" borderRadius="card" /> : <NextStepCard steps={steps} />}

            <Card>
              <ReadinessMeter score={data.readiness_score} message={data.readiness_message} />
            </Card>

            <SimpleGrid columns={2} gap="4">
              <Stat emoji="⭐" label="Saved replies" value={data.saved_reply_count} to="/replies" />
              <Stat emoji="📋" label="Pending tasks" value={data.pending_task_count} to="/handover" />
            </SimpleGrid>

            <Flex gap="3" wrap="wrap" aria-label="Quick actions" role="group">
              <Button asChild variant="outline" rounded="full" minH="11">
                <RouterLink to="/pto/new">🧳 Plan PTO</RouterLink>
              </Button>
              <Button asChild variant="outline" rounded="full" minH="11">
                <RouterLink to="/replies/new">✉️ Generate reply</RouterLink>
              </Button>
              <Button asChild variant="outline" rounded="full" minH="11">
                <RouterLink to="/handover/new">📋 Add handover task</RouterLink>
              </Button>
            </Flex>

            {SHOW_DEMO && (
              <Box mt="4">
                <DemoInbox />
              </Box>
            )}
          </>
        )}
      </Stack>
    </PageWrapper>
  )
}
