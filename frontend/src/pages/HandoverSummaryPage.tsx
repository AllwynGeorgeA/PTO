import { Badge, Button, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { CopyButton } from '../components/ui/CopyButton'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
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
          <Heading size="xl">📄 Handover Summary</Heading>
          <Button asChild variant="outline" rounded="full">
            <Link to="/handover">Back to tasks</Link>
          </Button>
        </HStack>
        <GlassCard>
          <Stack gap="4">
            <Text color="fg.muted">One tidy document so your team can survive without you. Allegedly.</Text>
            <Stack gap="1">
              <label htmlFor="summary-plan">PTO plan (optional)</label>
              <select
                id="summary-plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="chakra-select"
              >
                <option value="">All handover tasks</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.start_date} to {p.end_date} ({p.employee_name})
                  </option>
                ))}
              </select>
            </Stack>
            <GradientButton alignSelf="flex-start" loading={busy} disabled={busy} onClick={() => void run()}>
              {result ? '🔄 Regenerate summary' : '✨ Generate summary'}
            </GradientButton>
          </Stack>
        </GlassCard>
        {error && (
          <Text role="alert" color="red.500">
            {error}
          </Text>
        )}
        {result && (
          <GlassCard>
            <HStack mb="3" justify="space-between" wrap="wrap">
              {result.source === 'template' ? <Badge variant="subtle">Template summary</Badge> : <Badge colorPalette="teal">AI summary</Badge>}
              <CopyButton text={result.summary} label="Copy summary" />
            </HStack>
            <Text as="pre" whiteSpace="pre-wrap" fontFamily="inherit" aria-label="Handover summary">
              {result.summary}
            </Text>
          </GlassCard>
        )}
      </Stack>
    </PageWrapper>
  )
}
