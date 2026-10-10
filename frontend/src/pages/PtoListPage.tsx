import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { StatusBadge } from '../components/pto/StatusBadge'
import { AnimatedList } from '../components/ui/AnimatedList'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorNote } from '../components/ui/ErrorNote'
import { LoadingNote } from '../components/ui/LoadingNote'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { toastOk } from '../lib/toast'
import { usePtoPlans } from '../hooks/usePtoPlans'
import { countdownText, errorMessage, formatDate } from '../lib/pto'
import { ptoService } from '../services/ptoService'

export default function PtoListPage() {
  const { plans, loading, error, reload } = usePtoPlans()
  const [actionError, setActionError] = useState<string | null>(null)

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this leave? Your boss will be thrilled. 🙃')) return
    try {
      await ptoService.remove(id)
      toastOk('Leave deleted. Your boss is thrilled. 🎊')
      reload()
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  const shownError = error ?? actionError
  return (
    <PageWrapper>
      <Flex justify="space-between" align="center" mb="6" wrap="wrap" gap="3">
        <Heading size="2xl">🗓️ Your escape plans</Heading>
        {plans.length > 0 && (
          <PrimaryButton asChild>
            <RouterLink to="/pto/new">Plan PTO 🧳</RouterLink>
          </PrimaryButton>
        )}
      </Flex>

      {shownError && (
        <Box mb="4">
          <ErrorNote message={shownError} onRetry={reload} />
        </Box>
      )}

      {loading && plans.length === 0 ? (
        <LoadingNote rows={2} line="Checking which days you are allowed to disappear…" />
      ) : plans.length === 0 && !error ? (
        <EmptyState
          emoji="🏖️"
          title="No PTO planned yet"
          text="Your future self is already packing. Plan your first break."
          to="/pto/new"
          cta="Plan your first PTO 🧳"
        />
      ) : (
        <AnimatedList>
          {plans.map((p) => (
            <Card key={p.id}>
              <Flex justify="space-between" align="start" wrap="wrap" gap="3">
                <Box>
                  <Flex align="center" gap="3" mb="1">
                    <Heading size="md">{p.employee_name}</Heading>
                    <StatusBadge status={p.status} />
                  </Flex>
                  <Text color="fg.muted">
                    {formatDate(p.start_date)} to {formatDate(p.end_date)}
                  </Text>
                  <Text fontWeight="semibold" mt="1">
                    {countdownText(p.status, p.days_remaining)}
                  </Text>
                </Box>
                <Stack direction="row" gap="2">
                  <Button asChild size="sm" variant="outline" minH="11">
                    <RouterLink to={`/pto/${p.id}`}>View</RouterLink>
                  </Button>
                  <Button asChild size="sm" variant="outline" minH="11">
                    <RouterLink to={`/pto/${p.id}/edit`}>Edit</RouterLink>
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="accent"
                    variant="outline"
                    minH="11"
                    aria-label={`Delete PTO plan for ${p.employee_name}`}
                    onClick={() => void onDelete(p.id)}
                  >
                    Delete
                  </Button>
                </Stack>
              </Flex>
            </Card>
          ))}
        </AnimatedList>
      )}
    </PageWrapper>
  )
}
