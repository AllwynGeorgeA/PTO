import { Field, Heading, Input, Skeleton, Stack, Text, Textarea } from '@chakra-ui/react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { usePtoPlan } from '../hooks/usePtoPlans'
import type { PtoPlan } from '../types'
import { errorMessage, validatePto } from '../lib/pto'
import { ptoService } from '../services/ptoService'
import type { PtoFormErrors, PtoFormValues } from '../types/pto'

const blank: PtoFormValues = {
  employee_name: '',
  start_date: '',
  end_date: '',
  backup_person: '',
  contact_email: '',
  reason: '',
}

const FIELDS: { key: keyof PtoFormValues; label: string; type: string }[] = [
  { key: 'employee_name', label: 'Your name', type: 'text' },
  { key: 'start_date', label: 'Start date', type: 'date' },
  { key: 'end_date', label: 'End date', type: 'date' },
  { key: 'backup_person', label: 'Backup person', type: 'text' },
  { key: 'contact_email', label: 'Contact email', type: 'email' },
]

export default function PtoFormPage() {
  const { id } = useParams()
  const planId = id ? Number(id) : null
  const { plan, loading, error } = usePtoPlan(planId)
  if (planId !== null && loading) return <Skeleton height="240px" borderRadius="card" />
  // key remounts the form once the plan arrives so state starts from its values
  return <PtoForm key={plan?.id ?? 'new'} planId={planId} plan={plan} loadError={error} />
}

function PtoForm({ planId, plan, loadError }: { planId: number | null; plan: PtoPlan | null; loadError: string | null }) {
  const navigate = useNavigate()
  const [values, setValues] = useState<PtoFormValues>(plan ? { ...plan, reason: plan.reason ?? '' } : blank)
  const [errors, setErrors] = useState<PtoFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validatePto(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setSubmitError(null)
    const input = { ...values, reason: values.reason.trim() || null }
    try {
      const saved = planId === null ? await ptoService.create(input) : await ptoService.update(planId, input)
      navigate(`/pto/${saved.id}`)
    } catch (err) {
      setSubmitError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <PageWrapper>
      <Heading size="2xl" mb="6">
        {planId === null ? '🧳 Plan PTO' : '✏️ Edit PTO'}
      </Heading>
      <form noValidate onSubmit={(e) => void onSubmit(e)}>
      <GlassCard maxW="xl">
        <Stack gap="4">
          {(loadError ?? submitError) && (
            <Text role="alert" color="red.500">
              {loadError ?? submitError}
            </Text>
          )}
          {FIELDS.map((f) => (
            <Field.Root key={f.key} invalid={Boolean(errors[f.key])} required>
              <Field.Label>{f.label}</Field.Label>
              <Input
                type={f.type}
                value={values[f.key]}
                onChange={(ev) => setValues({ ...values, [f.key]: ev.target.value })}
              />
              <Field.ErrorText>{errors[f.key]}</Field.ErrorText>
            </Field.Root>
          ))}
          <Field.Root>
            <Field.Label>Reason (optional)</Field.Label>
            <Textarea value={values.reason} onChange={(ev) => setValues({ ...values, reason: ev.target.value })} />
          </Field.Root>
          <GradientButton type="submit" loading={saving}>
            {planId === null ? 'Create PTO plan' : 'Save changes'}
          </GradientButton>
        </Stack>
      </GlassCard>
      </form>
    </PageWrapper>
  )
}
