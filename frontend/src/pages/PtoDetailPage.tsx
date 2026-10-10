import { Button, DataList, Flex, Heading, Skeleton, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { StatusBadge } from '../components/pto/StatusBadge'
import { GlassCard } from '../components/ui/GlassCard'
import { usePtoPlan } from '../hooks/usePtoPlans'
import { daysUntil } from '../lib/format'
import { countdownText, errorMessage, formatDate } from '../lib/pto'
import { ptoService } from '../services/ptoService'

export default function PtoDetailPage() {
  const { id } = useParams()
  const planId = Number(id)
  const navigate = useNavigate()
  const { plan, loading, error } = usePtoPlan(Number.isInteger(planId) ? planId : null)
  const [actionError, setActionError] = useState<string | null>(null)

  const onDelete = async () => {
    if (!plan || !window.confirm(`Delete the PTO plan for ${plan.employee_name}?`)) return
    try {
      await ptoService.remove(plan.id)
      navigate('/pto')
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  if (loading) return <Skeleton height="240px" borderRadius="card" />
  if (!plan)
    return (
      <Text role="alert" color="red.500">
        {error ?? 'PTO plan not found.'}
      </Text>
    )

  const dayNumber = 1 - daysUntil(plan.start_date)
  const details: [string, string][] = [
    ['Dates', `${formatDate(plan.start_date)} to ${formatDate(plan.end_date)}`],
    ['Backup person', plan.backup_person],
    ['Contact email', plan.contact_email],
    ['Reason', plan.reason ?? 'Not specified'],
  ]

  return (
    <PageWrapper>
      <GlassCard textAlign="center" mb="6" py="10">
        <StatusBadge status={plan.status} />
        <Heading size="3xl" mt="3">
          {countdownText(plan.status, plan.days_remaining, dayNumber)}
        </Heading>
        <Text color="fg.muted" mt="1">
          {plan.employee_name}
        </Text>
      </GlassCard>

      <GlassCard mb="6">
        <DataList.Root>
          {details.map(([label, value]) => (
            <DataList.Item key={label}>
              <DataList.ItemLabel>{label}</DataList.ItemLabel>
              <DataList.ItemValue>{value}</DataList.ItemValue>
            </DataList.Item>
          ))}
        </DataList.Root>
      </GlassCard>

      {actionError && (
        <Text role="alert" color="red.500" mb="3">
          {actionError}
        </Text>
      )}
      <Flex gap="3" wrap="wrap">
        <Button asChild colorPalette="brand">
          <RouterLink to="/handover">Handover tasks</RouterLink>
        </Button>
        <Button asChild colorPalette="brand" variant="outline">
          <RouterLink to="/replies/new">Generate reply</RouterLink>
        </Button>
        <Button asChild variant="outline">
          <RouterLink to={`/pto/${plan.id}/edit`}>Edit</RouterLink>
        </Button>
        <Button colorPalette="red" variant="outline" onClick={() => void onDelete()}>
          Delete
        </Button>
      </Flex>
    </PageWrapper>
  )
}
