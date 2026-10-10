import { Badge, Button, Field, Heading, HStack, NativeSelect, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/ui/Card'
import { CopyButton } from '../components/ui/CopyButton'
import { ErrorNote } from '../components/ui/ErrorNote'
import { LoadingNote } from '../components/ui/LoadingNote'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { usePtoPlans } from '../hooks/usePtoPlans'
import { generateSummary } from '../services/handover'
import { errorMessage } from '../services/replies'
import type { HandoverSummary } from '../types'

export default function HandoverSummaryPage() {
  const { plans } = usePtoPlans()
  const [planId, setPlanId] = useState('')
  const [result, setResult] = useState<HandoverSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      setResult(await generateSummary(planId ? Number(planId) : undefined))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageWrapper>
      <Stack gap="5" maxW="3xl">
        <HStack justify="space-between" wrap="wrap">
          <Heading size="2xl">📄 Survive-without-me doc</Heading>
          <Button asChild variant="outline" rounded="full" minH="11">
            <Link to="/handover">Back to tasks</Link>
          </Button>
        </HStack>
        <Card>
          <Stack gap="4">
            <Text color="fg.muted">One tidy document so your team can survive without you. Allegedly. 🫡</Text>
            <Field.Root>
              <Field.Label>PTO plan (optional)</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field id="summary-plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                  <option value="">All handover tasks</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.start_date} to {p.end_date} ({p.employee_name})
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <PrimaryButton alignSelf="flex-start" loading={busy} disabled={busy} onClick={() => void run()}>
              {result ? '🔄 Another take' : '✨ Write my survival guide'}
            </PrimaryButton>
          </Stack>
        </Card>
        {busy && <LoadingNote rows={1} line="Summarising everything only you know…" />}
        {error && <ErrorNote message={error} />}
        {result && !busy && (
          <Card>
            <HStack mb="3" justify="space-between" wrap="wrap">
              {result.source === 'template' ? (
                <Badge variant="subtle" colorPalette="gray">
                  Template summary
                </Badge>
              ) : (
                <Badge>AI summary</Badge>
              )}
              <CopyButton text={result.summary} label="Copy summary" doneToast="Copied! Hand it over and vanish 🫡" />
            </HStack>
            <Text as="pre" whiteSpace="pre-wrap" fontFamily="inherit" aria-label="Handover summary">
              {result.summary}
            </Text>
          </Card>
        )}
      </Stack>
    </PageWrapper>
  )
}
