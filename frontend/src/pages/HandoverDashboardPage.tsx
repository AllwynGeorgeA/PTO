import { Badge, Box, Button, Heading, HStack, Progress, Stack, Text } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { AnimatedList } from '../components/ui/AnimatedList'
import { GlassCard } from '../components/ui/GlassCard'
import { useTasks } from '../hooks/useHandover'
import { deleteTask, toggleTask } from '../services/handover'
import { errorMessage } from '../services/replies'
import type { TaskPriority, TaskStatus } from '../types'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../types/handover'

const todayIso = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function HandoverDashboardPage() {
  const { data: tasks, loading, error, reload } = useTasks()
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all')
  const [actionError, setActionError] = useState<string | null>(null)
  const today = todayIso()

  const done = tasks.filter((t) => t.status === 'completed').length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  const shown = useMemo(
    () =>
      tasks.filter((t) => (status === 'all' || t.status === status) && (priority === 'all' || t.priority === priority)),
    [tasks, status, priority],
  )

  const act = async (fn: () => Promise<unknown>) => {
    setActionError(null)
    try {
      await fn()
      reload()
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  const shownError = error ?? actionError
  return (
    <PageWrapper>
      <Stack gap="5" maxW="3xl">
        <HStack justify="space-between" wrap="wrap">
          <Heading size="xl">🧳 Handover Tasks</Heading>
          <HStack>
            <Button asChild variant="outline" rounded="full">
              <Link to="/handover/summary">Summary</Link>
            </Button>
            <Button asChild rounded="full">
              <Link to="/handover/new">+ Add task</Link>
            </Button>
          </HStack>
        </HStack>

        <GlassCard>
          <HStack justify="space-between" mb="2">
            <Text fontWeight="semibold">Handover progress</Text>
            <Text color="fg.muted">
              {done}/{tasks.length} done ({pct}%)
            </Text>
          </HStack>
          <Progress.Root value={pct} aria-label="Handover completion" colorPalette="teal">
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </GlassCard>

        <HStack wrap="wrap" gap="2" role="group" aria-label="Filters">
          {STATUS_OPTIONS.map((o) => (
            <Button
              key={o.value}
              size="sm"
              rounded="full"
              variant={status === o.value ? 'solid' : 'outline'}
              aria-pressed={status === o.value}
              onClick={() => setStatus(o.value)}
            >
              {o.label}
            </Button>
          ))}
          <Box w="2" />
          {[{ value: 'all' as const, label: 'Any priority' }, ...PRIORITY_OPTIONS].map((o) => (
            <Button
              key={o.value}
              size="sm"
              rounded="full"
              variant={priority === o.value ? 'solid' : 'outline'}
              aria-pressed={priority === o.value}
              onClick={() => setPriority(o.value)}
            >
              {o.label}
            </Button>
          ))}
        </HStack>

        {loading && <Text color="fg.muted">Counting what only you know...</Text>}
        {shownError && (
          <Text role="alert" color="red.500">
            {shownError}
          </Text>
        )}
        {!loading && !error && tasks.length === 0 && (
          <GlassCard>
            <Text mb="3">No handover tasks. Either you are perfectly organised or everything is in your head.</Text>
            <Button asChild rounded="full">
              <Link to="/handover/new">Add your first task</Link>
            </Button>
          </GlassCard>
        )}
        {!loading && tasks.length > 0 && shown.length === 0 && <Text color="fg.muted">Nothing matches these filters.</Text>}

        <AnimatedList>
          {shown.map((t) => {
            const completed = t.status === 'completed'
            const overdue = !completed && t.deadline !== null && t.deadline < today
            const prio = PRIORITY_OPTIONS.find((p) => p.value === t.priority)
            return (
              <GlassCard key={t.id} p="4" borderColor={overdue ? 'red.500' : 'border'}>
                <HStack align="flex-start" gap="3">
                  <input
                    type="checkbox"
                    checked={completed}
                    aria-label={`Mark "${t.name}" as ${completed ? 'pending' : 'completed'}`}
                    onChange={() => void act(() => toggleTask(t.id))}
                  />
                  <Stack gap="1" flex="1">
                    <Text fontWeight="semibold" textDecoration={completed ? 'line-through' : 'none'}>
                      {t.name}
                    </Text>
                    {t.description && (
                      <Text fontSize="sm" color="fg.muted">
                        {t.description}
                      </Text>
                    )}
                    <HStack wrap="wrap" gap="2">
                      <Badge colorPalette={prio?.color}>{prio?.label}</Badge>
                      {t.backup_person && <Badge variant="subtle">Backup: {t.backup_person}</Badge>}
                      {t.deadline && (
                        <Badge colorPalette={overdue ? 'red' : 'gray'}>
                          {overdue ? 'Overdue: ' : 'Due '}
                          {t.deadline}
                        </Badge>
                      )}
                    </HStack>
                  </Stack>
                  <HStack>
                    <Button asChild size="xs" variant="ghost">
                      <Link to={`/handover/${t.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      aria-label={`Delete ${t.name}`}
                      onClick={() => void act(() => deleteTask(t.id))}
                    >
                      Delete
                    </Button>
                  </HStack>
                </HStack>
              </GlassCard>
            )
          })}
        </AnimatedList>
      </Stack>
    </PageWrapper>
  )
}
