import { Badge, Button, Heading, HStack, Input, Progress, Stack, Text } from '@chakra-ui/react'
import { useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { AnimatedList } from '../components/ui/AnimatedList'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorNote } from '../components/ui/ErrorNote'
import { useFun } from '../hooks/useFun'
import { LoadingNote } from '../components/ui/LoadingNote'
import { toaster, toastError, toastOk } from '../lib/toast'
import { useMotionOk } from '../hooks/useMotion'
import { useTasks } from '../hooks/useHandover'
import { MotionButton } from '../lib/motion'
import { createTask, deleteTask, toggleTask } from '../services/handover'
import { errorMessage } from '../services/replies'
import type { HandoverTask, TaskPriority, TaskStatus } from '../types'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../types/handover'

const todayIso = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function HandoverDashboardPage() {
  const { data: tasks, loading, error, reload } = useTasks()
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all')
  const [quick, setQuick] = useState('')
  const [adding, setAdding] = useState(false)
  const ok = useMotionOk()
  const { burst } = useFun()
  const today = todayIso()

  const done = tasks.filter((t) => t.status === 'completed').length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  const shown = useMemo(
    () =>
      tasks.filter((t) => (status === 'all' || t.status === status) && (priority === 'all' || t.priority === priority)),
    [tasks, status, priority],
  )

  const quickAdd = async (e: FormEvent) => {
    e.preventDefault()
    const name = quick.trim()
    if (!name || adding) return
    setAdding(true)
    try {
      await createTask({ pto_plan_id: null, name, description: null, priority: 'medium', backup_person: null, deadline: null })
      setQuick('')
      toastOk('Added! One less thing in your head 🧠')
      reload()
    } catch (err) {
      toastError('That task refused to be added.', errorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  const complete = async (t: HandoverTask, e: MouseEvent<HTMLButtonElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const completing = t.status !== 'completed'
    try {
      await toggleTask(t.id)
    } catch (err) {
      toastError('Could not update that task.', errorMessage(err))
      return
    }
    reload()
    if (!completing) return
    burst({ x: box.left + box.width / 2, y: box.top })
    const last = done + 1 === tasks.length
    toaster.create({
      title: last ? 'Handover complete! Go be free 🎉' : 'Done! One less thing for future you 🎉',
      type: 'success',
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          toggleTask(t.id).then(reload, (err: unknown) => toastError('Undo failed.', errorMessage(err)))
        },
      },
    })
  }

  const remove = async (t: HandoverTask) => {
    if (!window.confirm('Delete this task? Your boss will be thrilled. 🙃')) return
    try {
      await deleteTask(t.id)
      toastOk('Deleted. It never existed. 🕵️')
      reload()
    } catch (err) {
      toastError('Could not delete that task.', errorMessage(err))
    }
  }

  return (
    <PageWrapper>
      <Stack gap="5" maxW="3xl">
        <HStack justify="space-between" wrap="wrap">
          <Heading size="2xl">🧳 Brain dump HQ</Heading>
          <Button asChild variant="outline" rounded="full" minH="11">
            <Link to="/handover/summary">📄 Summary</Link>
          </Button>
        </HStack>

        <form onSubmit={(e) => void quickAdd(e)} aria-label="Quick add task">
          <HStack gap="2">
            <Input
              aria-label="New task name"
              placeholder="Type a task and press Enter, e.g. 'Restart the thing only I restart'"
              value={quick}
              maxLength={200}
              minH="11"
              onChange={(e) => setQuick(e.target.value)}
            />
            <Button type="submit" rounded="full" minH="11" loading={adding} disabled={!quick.trim()}>
              ➕ Add
            </Button>
          </HStack>
        </form>

        <Card p="4">
          <HStack justify="space-between" mb="2">
            <Text fontWeight="semibold">Handover progress</Text>
            <Text color="fg.muted">
              {done}/{tasks.length} done ({pct}%)
            </Text>
          </HStack>
          <Progress.Root value={pct} aria-label="Handover completion">
            <Progress.Track rounded="full">
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </Card>

        <HStack wrap="wrap" gap="2" role="group" aria-label="Filters">
          {STATUS_OPTIONS.map((o) => (
            <Button
              key={o.value}
              size="sm"
              rounded="full"
              minH="11"
              variant={status === o.value ? 'solid' : 'outline'}
              aria-pressed={status === o.value}
              onClick={() => setStatus(o.value)}
            >
              {o.label}
            </Button>
          ))}
          {[{ value: 'all' as const, label: 'Any priority' }, ...PRIORITY_OPTIONS].map((o) => (
            <Button
              key={o.value}
              size="sm"
              rounded="full"
              minH="11"
              colorPalette="gray"
              variant={priority === o.value ? 'solid' : 'outline'}
              aria-pressed={priority === o.value}
              onClick={() => setPriority(o.value)}
            >
              {o.label}
            </Button>
          ))}
        </HStack>

        {loading && tasks.length === 0 && <LoadingNote rows={2} line="Counting what only you know…" />}
        {error && <ErrorNote message={error} onRetry={reload} />}
        {!loading && !error && tasks.length === 0 && (
          <EmptyState
            emoji="🧠"
            title="Your brain is suspiciously empty"
            text="Either you are perfectly organised or everything is in your head. Type a task above to start."
            to="/handover/new"
            cta="Add a detailed task ➕"
          />
        )}
        {tasks.length > 0 && shown.length === 0 && <Text color="fg.muted">Nothing matches these filters. Suspicious. 🕵️</Text>}

        <AnimatedList>
          {shown.map((t) => {
            const completed = t.status === 'completed'
            const overdue = !completed && t.deadline !== null && t.deadline < today
            const prio = PRIORITY_OPTIONS.find((p) => p.value === t.priority)
            return (
              <Card key={t.id} p="4" borderColor={overdue ? 'accent.solid' : 'border'}>
                <HStack align="flex-start" gap="3">
                  <MotionButton
                    role="checkbox"
                    aria-checked={completed}
                    aria-label={`Mark "${t.name}" as ${completed ? 'pending' : 'completed'}`}
                    rounded="full"
                    boxSize="11"
                    minW="11"
                    p="0"
                    variant={completed ? 'solid' : 'outline'}
                    whileHover={ok ? { scale: 1.12 } : undefined}
                    whileTap={ok ? { scale: 0.8, rotate: -12 } : undefined}
                    onClick={(e) => void complete(t, e)}
                  >
                    {completed ? '✓' : ''}
                  </MotionButton>
                  <Stack gap="1" flex="1" minW="0">
                    <Text fontWeight="semibold" textDecoration={completed ? 'line-through' : 'none'} color={completed ? 'fg.muted' : 'fg'}>
                      {t.name}
                    </Text>
                    {t.description && (
                      <Text fontSize="sm" color="fg.muted">
                        {t.description}
                      </Text>
                    )}
                    <HStack wrap="wrap" gap="2">
                      <Badge colorPalette={prio?.color}>{prio?.label}</Badge>
                      {t.backup_person && <Badge variant="subtle" colorPalette="gray">Backup: {t.backup_person}</Badge>}
                      {t.deadline && (
                        <Badge colorPalette={overdue ? 'accent' : 'gray'}>
                          {overdue ? 'Overdue 😬 ' : 'Due '}
                          {t.deadline}
                        </Badge>
                      )}
                    </HStack>
                  </Stack>
                  <HStack gap="0">
                    <Button asChild size="sm" variant="ghost" minH="11">
                      <Link to={`/handover/${t.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="accent"
                      minH="11"
                      aria-label={`Delete ${t.name}`}
                      onClick={() => void remove(t)}
                    >
                      Delete
                    </Button>
                  </HStack>
                </HStack>
              </Card>
            )
          })}
        </AnimatedList>
      </Stack>
    </PageWrapper>
  )
}
