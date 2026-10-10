import { Button, DataList, Flex, Skeleton } from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Countdown } from '../components/pto/Countdown'
import { StatusBadge } from '../components/pto/StatusBadge'
import { Card } from '../components/ui/Card'
import { ErrorNote } from '../components/ui/ErrorNote'
import { toastOk } from '../lib/toast'
import { usePtoPlan } from '../hooks/usePtoPlans'
import { daysUntil } from '../lib/format'
import { errorMessage, formatDate } from '../lib/pto'
import { ptoService } from '../services/ptoService'

export default function PtoDetailPage() {
  const { id } = useParams()
  const planId = Number(id)
  const navigate = useNavigate()
  const { plan, loading, error } = usePtoPlan(Number.isInteger(planId) ? planId : null)
  const [actionError, setActionError] = useState<string | null>(null)

  const onDelete = async () => {
    if (!plan || !window.confirm('Delete this leave? Your boss will be thrilled. 🙃')) return
    try {
      await ptoService.remove(plan.id)
      toastOk('Leave deleted. Your boss is thrilled. 🎊')
      navigate('/pto')
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  if (loading) return <Skeleton height="240px" borderRadius="card" />
  if (!plan) return <ErrorNote message={error ?? 'PTO plan not found. Maybe it took a vacation too. 🏝️'} />

  const dayNumber = 1 - daysUntil(plan.start_date)
  const details: [string, string][] = [
    ['Dates', `${formatDate(plan.start_date)} to ${formatDate(plan.end_date)}`],
    ['Backup person', plan.backup_person],
    ['Contact email', plan.contact_email],
    ['Reason', plan.reason ?? 'Not specified (mysterious 🕵️)'],
  ]

  return (
    <PageWrapper>
      <Card textAlign="center" mb="6" py="10">
        <StatusBadge status={plan.status} />
        <Flex justify="center" mt="4">
          <Countdown status={plan.status} daysRemaining={plan.days_remaining} dayNumber={dayNumber} />
        </Flex>
      </Card>

      <Card mb="6">
        <DataList.Root>
          {details.map(([label, value]) => (
            <DataList.Item key={label}>
              <DataList.ItemLabel>{label}</DataList.ItemLabel>
              <DataList.ItemValue>{value}</DataList.ItemValue>
            </DataList.Item>
          ))}
        </DataList.Root>
      </Card>

      {actionError && <ErrorNote message={actionError} />}
      <Flex gap="3" wrap="wrap" mt="3">
        <Button asChild rounded="full" minH="11">
          <RouterLink to="/handover">📋 Handover tasks</RouterLink>
        </Button>
        <Button asChild variant="outline" rounded="full" minH="11">
          <RouterLink to="/replies/new">✉️ Generate reply</RouterLink>
        </Button>
        <Button asChild variant="outline" rounded="full" minH="11">
          <RouterLink to={`/pto/${plan.id}/edit`}>✏️ Edit</RouterLink>
        </Button>
        <Button colorPalette="accent" variant="outline" rounded="full" minH="11" onClick={() => void onDelete()}>
          🗑️ Delete
        </Button>
      </Flex>
    </PageWrapper>
  )
}
