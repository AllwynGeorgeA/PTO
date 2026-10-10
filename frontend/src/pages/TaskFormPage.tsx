import { Button, Field, Heading, HStack, Input, Stack, Text, Textarea } from '@chakra-ui/react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { useTask } from '../hooks/useHandover'
import { usePtoPlans } from '../hooks/usePtoPlans'
import { createTask, updateTask } from '../services/handover'
import { errorMessage } from '../services/replies'
import type { HandoverTaskInput, TaskPriority } from '../types'
import { PRIORITY_OPTIONS, validateTask, type TaskErrors, type TaskFormValues } from '../types/handover'

const blank: TaskFormValues = { name: '', description: '', priority: 'medium', backup_person: '', deadline: '', pto_plan_id: '' }

export default function TaskFormPage() {
  const { id } = useParams()
  const editId = id ? Number(id) : null
  const { data: existing, loading } = useTask(editId)
  if (editId !== null && loading) return <Text color="fg.muted">Loading task...</Text>
  const initial: TaskFormValues = existing
    ? {
        name: existing.name,
        description: existing.description ?? '',
        priority: existing.priority,
        backup_person: existing.backup_person ?? '',
        deadline: existing.deadline ?? '',
        pto_plan_id: existing.pto_plan_id === null ? '' : String(existing.pto_plan_id),
      }
    : blank
  return <TaskForm initial={initial} editId={editId} />
}

function TaskForm({ initial, editId }: { initial: TaskFormValues; editId: number | null }) {
  const navigate = useNavigate()
  const { plans } = usePtoPlans()
  const [values, setValues] = useState<TaskFormValues>(initial)
  const [errors, setErrors] = useState<TaskErrors>({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const set = <K extends keyof TaskFormValues>(k: K, v: TaskFormValues[K]) => setValues((s) => ({ ...s, [k]: v }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validateTask(values)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const body: HandoverTaskInput = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      priority: values.priority,
      backup_person: values.backup_person.trim() || null,
      deadline: values.deadline || null,
      pto_plan_id: values.pto_plan_id ? Number(values.pto_plan_id) : null,
    }
    setSaving(true)
    setSubmitError(null)
    try {
      if (editId === null) await createTask(body)
      else await updateTask(editId, body)
      navigate('/handover')
    } catch (err) {
      setSubmitError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <PageWrapper>
      <Stack gap="5" maxW="2xl">
        <Heading size="xl">{editId === null ? '➕ New handover task' : '✏️ Edit handover task'}</Heading>
        <GlassCard>
          <form onSubmit={onSubmit} noValidate>
            <Stack gap="4">
              <Field.Root invalid={!!errors.name} required>
                <Field.Label>Task name</Field.Label>
                <Input value={values.name} onChange={(e) => set('name', e.target.value)} placeholder="Restart the thing that only you restart" />
                <Field.ErrorText>{errors.name}</Field.ErrorText>
              </Field.Root>
              <Field.Root>
                <Field.Label>Description</Field.Label>
                <Textarea value={values.description} onChange={(e) => set('description', e.target.value)} rows={3} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Priority</Field.Label>
                <select
                  aria-label="Priority"
                  value={values.priority}
                  onChange={(e) => set('priority', e.target.value as TaskPriority)}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field.Root>
              <Field.Root>
                <Field.Label>Backup person</Field.Label>
                <Input value={values.backup_person} onChange={(e) => set('backup_person', e.target.value)} />
              </Field.Root>
              <Field.Root invalid={!!errors.deadline}>
                <Field.Label>Deadline</Field.Label>
                <Input type="date" value={values.deadline} onChange={(e) => set('deadline', e.target.value)} />
                <Field.ErrorText>{errors.deadline}</Field.ErrorText>
              </Field.Root>
              <Field.Root>
                <Field.Label>PTO plan (optional)</Field.Label>
                <select
                  aria-label="PTO plan"
                  value={values.pto_plan_id}
                  onChange={(e) => set('pto_plan_id', e.target.value)}
                >
                  <option value="">No specific plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.start_date} to {p.end_date} ({p.employee_name})
                    </option>
                  ))}
                </select>
              </Field.Root>
              {submitError && (
                <Text role="alert" color="red.500">
                  {submitError}
                </Text>
              )}
              <HStack>
                <GradientButton type="submit" loading={saving} disabled={saving}>
                  {editId === null ? 'Add task' : 'Save changes'}
                </GradientButton>
                <Button variant="ghost" onClick={() => navigate('/handover')}>
                  Cancel
                </Button>
              </HStack>
            </Stack>
          </form>
        </GlassCard>
      </Stack>
    </PageWrapper>
  )
}
