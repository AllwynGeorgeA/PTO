import { Box, Button, Flex, Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { StatusBadge } from '../components/pto/StatusBadge'
import { AnimatedList } from '../components/ui/AnimatedList'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { usePtoPlans } from '../hooks/usePtoPlans'
import { countdownText, errorMessage, formatDate } from '../lib/pto'
import { ptoService } from '../services/ptoService'

export default function PtoListPage() {
  const { plans, loading, error, reload } = usePtoPlans()
  const [actionError, setActionError] = useState<string | null>(null)

  const onDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete the PTO plan for ${name}?`)) return
    try {
      await ptoService.remove(id)
      reload()
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  return (
    <PageWrapper>
      <Flex justify="space-between" align="center" mb="6" wrap="wrap" gap="3">
        <Heading size="2xl">🗓️ PTO Planner</Heading>
        <GradientButton asChild>
          <RouterLink to="/pto/new">Plan PTO</RouterLink>
        </GradientButton>
      </Flex>

      {(error ?? actionError) && (
        <Text role="alert" color="red.500" mb="4">
          {error ?? actionError}
        </Text>
      )}

      {loading ? (
        <Skeleton height="120px" borderRadius="card" />
      ) : plans.length === 0 && !error ? (
        <GlassCard textAlign="center" py="12">
          <Heading size="lg" mb="2">
            No PTO planned yet 🏖️
          </Heading>
          <Text color="fg.muted" mb="5">
            Your future self is already packing. Plan your first break.
          </Text>
          <GradientButton asChild>
            <RouterLink to="/pto/new">Plan your first PTO</RouterLink>
          </GradientButton>
        </GlassCard>
      ) : (
        <AnimatedList>
          {plans.map((p) => (
            <GlassCard key={p.id}>
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
                  <Button asChild size="sm" variant="outline">
                    <RouterLink to={`/pto/${p.id}`}>View</RouterLink>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <RouterLink to={`/pto/${p.id}/edit`}>Edit</RouterLink>
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="red"
                    variant="outline"
                    aria-label={`Delete PTO plan for ${p.employee_name}`}
                    onClick={() => void onDelete(p.id, p.employee_name)}
                  >
                    Delete
                  </Button>
                </Stack>
              </Flex>
            </GlassCard>
          ))}
        </AnimatedList>
      )}
    </PageWrapper>
  )
}
