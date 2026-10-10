import { Alert, Badge, Box, Button, Heading, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { useAuth } from '../context/AuthContext'
import { checkout, getPlans } from '../services/billing'
import type { BillingInfo, PlanId } from '../types'

const BLURBS: Record<PlanId, string> = {
  free: '5 AI replies/month',
  pro: 'Unlimited AI replies',
  team: 'Up to 10 users',
}
const PRICES: Record<PlanId, string> = { free: '$0', pro: '$4.99', team: '$19' }

const FAQ: { q: string; a: string }[] = [
  { q: 'Can I cancel anytime?', a: 'Yes. Like your out-of-office, it ends when you say so.' },
  {
    q: 'What happens at the free limit?',
    a: 'You get 5 AI replies a month. After that, the replies take their own PTO until next month.',
  },
  { q: 'Will my boss see I use this?', a: 'Only your very professional replies. The savage ones stay office-safe.' },
  { q: 'Is my data safe?', a: 'Yes. We store what we need to protect your peace, and nothing else.' },
]

export default function PricingPage() {
  const { user } = useAuth()
  const [info, setInfo] = useState<BillingInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<PlanId | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    getPlans()
      .then(setInfo)
      .catch(() => setError('Could not load plans. Please try again shortly.'))
  }, [])

  const choose = async (plan: 'pro' | 'team') => {
    setBusy(plan)
    setNotice(null)
    setError(null)
    try {
      const res = await checkout(plan)
      if (!res.demo && res.checkout_url) {
        window.location.assign(res.checkout_url)
        return
      }
      setNotice(res.message ?? 'Demo mode: no payment was made and your plan has not changed.')
    } catch {
      setError('Checkout failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <PageWrapper>
      <Stack gap="8">
        <Box textAlign="center">
          <Heading size="3xl">Pricing</Heading>
          <Text color="fg.muted">Your PTO is approved. Your peace is protected.</Text>
        </Box>

        {info?.demo && (
          <Alert.Root status="warning" role="status">
            <Alert.Indicator />
            <Alert.Title>Demo mode: payments are not connected, no real charge will be made</Alert.Title>
          </Alert.Root>
        )}
        {notice && (
          <Alert.Root status="info" role="status">
            <Alert.Indicator />
            <Alert.Title>{notice}</Alert.Title>
          </Alert.Root>
        )}
        {error && (
          <Alert.Root status="error" role="alert">
            <Alert.Indicator />
            <Alert.Title>{error}</Alert.Title>
          </Alert.Root>
        )}

        {!info && !error && <Spinner alignSelf="center" size="xl" color="ocean.500" aria-label="Loading plans" />}

        {info && (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
            {info.plans.map((p) => {
              const current = user?.plan === p.id
              const popular = p.id === 'pro'
              return (
                <GlassCard key={p.id} borderColor={popular ? 'ocean.400' : 'border'} borderWidth={popular ? '2px' : '1px'}>
                  <Stack gap="4" h="full">
                    <Stack direction="row" justify="space-between" align="center">
                      <Heading size="lg">{p.name}</Heading>
                      {popular && <Badge colorPalette="orange">Most popular</Badge>}
                      {current && <Badge colorPalette="green">Current plan</Badge>}
                    </Stack>
                    <Text fontSize="3xl" fontWeight="bold">
                      {PRICES[p.id] ?? `$${p.price}`}
                      <Text as="span" fontSize="sm" color="fg.muted">
                        {p.id === 'free' ? '' : '/month'}
                      </Text>
                    </Text>
                    <Text fontWeight="semibold">{BLURBS[p.id]}</Text>
                    <Stack as="ul" gap="1" pl="4" flex="1">
                      {p.features.map((f) => (
                        <Text as="li" key={f} color="fg.muted">
                          {f}
                        </Text>
                      ))}
                    </Stack>
                    {!user ? (
                      <Button asChild variant={popular ? 'solid' : 'outline'}>
                        <Link to="/register">{p.id === 'free' ? 'Get started free' : `Choose ${p.name}`}</Link>
                      </Button>
                    ) : p.id === 'free' || current ? (
                      <Button disabled variant="outline">
                        {current ? 'Current plan' : 'Included'}
                      </Button>
                    ) : (
                      <GradientButton
                        onClick={() => void choose(p.id === 'team' ? 'team' : 'pro')}
                        loading={busy === p.id}
                        aria-label={`Choose ${p.name} plan`}
                      >
                        Choose {p.name}
                      </GradientButton>
                    )}
                  </Stack>
                </GlassCard>
              )
            })}
          </SimpleGrid>
        )}

        <Stack gap="3" as="section" aria-label="FAQ">
          <Heading size="xl">FAQ</Heading>
          {FAQ.map((f) => (
            <Box key={f.q}>
              <Text fontWeight="semibold">{f.q}</Text>
              <Text color="fg.muted">{f.a}</Text>
            </Box>
          ))}
        </Stack>
      </Stack>
    </PageWrapper>
  )
}
