import { Button, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { TryItDemo } from '../components/landing/TryItDemo'
import { Card } from '../components/ui/Card'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { useMotionOk } from '../hooks/useMotion'
import { MotionBox } from '../lib/motion'

const FEATURES = [
  { emoji: '🗓️', title: 'PTO planner', text: 'Plan time off and let the calendar handle the guilt.' },
  { emoji: '🤖', title: 'Funny AI replies', text: 'Out-of-office messages that are polite, professional and a little bit smug.' },
  { emoji: '🤝', title: 'Handover helper', text: 'Hand off tasks cleanly so nobody pings you on a beach.' },
]

const PLANS = [
  { name: 'Free', price: '$0', text: '20 replies a month', emoji: '🆓' },
  { name: 'Pro', price: '$4.99', text: 'Unlimited AI replies', emoji: '😎', highlight: true },
  { name: 'Team', price: '$19', text: 'Up to 10 teammates', emoji: '👯' },
]

export default function HomePage() {
  const ok = useMotionOk()
  return (
    <Stack gap={{ base: '14', md: '20' }} maxW="5xl" mx="auto">
      <Stack as="section" align="center" textAlign="center" gap="6" pt={{ base: '6', md: '12' }}>
        <MotionBox
          fontSize="7xl"
          aria-hidden="true"
          animate={ok ? { y: [0, -12, 0], rotate: [0, -6, 6, 0] } : undefined}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          🦥
        </MotionBox>
        <Heading as="h1" size={{ base: '3xl', md: '5xl' }} lineHeight="1.1">
          Your PTO is approved.{' '}
          <Text as="span" color="brand.fg">
            Your peace is protected.
          </Text>{' '}
          😂
        </Heading>
        <Text fontSize={{ base: 'md', md: 'xl' }} color="fg.muted" maxW="2xl">
          PTOShield AI plans your time off, writes witty out-of-office replies and hands over your work, so you can
          actually unplug.
        </Text>
        <Flex gap="3" wrap="wrap" justify="center">
          <PrimaryButton asChild size="lg">
            <RouterLink to="/register">Start free 🌴</RouterLink>
          </PrimaryButton>
          <Button asChild size="lg" variant="outline" rounded="full" minH="11">
            <RouterLink to="/login">I already escaped</RouterLink>
          </Button>
        </Flex>
        <TryItDemo />
      </Stack>

      <section aria-labelledby="features-heading">
        <Heading id="features-heading" size="3xl" textAlign="center" mb="8">
          Everything between you and the beach 🏖️
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="5">
          {FEATURES.map((f) => (
            <Card key={f.title} whileHover={ok ? { y: -6, rotate: -1.5 } : undefined} whileTap={ok ? { scale: 0.97 } : undefined}>
              <Text fontSize="4xl" aria-hidden="true">
                {f.emoji}
              </Text>
              <Heading size="lg" mt="2" mb="2">
                {f.title}
              </Heading>
              <Text color="fg.muted">{f.text}</Text>
            </Card>
          ))}
        </SimpleGrid>
      </section>

      <section aria-labelledby="pricing-heading">
        <Heading id="pricing-heading" size="3xl" textAlign="center" mb="2">
          Cheaper than one airport sandwich 🥪
        </Heading>
        <Text textAlign="center" color="fg.muted" mb="8">
          Pricing that will not need approval.
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="5">
          {PLANS.map((p) => (
            <Card key={p.name} borderColor={p.highlight ? 'brand.solid' : 'border'} borderWidth={p.highlight ? '2px' : '1px'}>
              <Text fontSize="2xl" aria-hidden="true">
                {p.emoji}
              </Text>
              <Heading size="lg">{p.name}</Heading>
              <Text fontSize="4xl" fontWeight="bold">
                {p.price}
                {p.price !== '$0' && (
                  <Text as="span" fontSize="md" color="fg.muted">
                    /mo
                  </Text>
                )}
              </Text>
              <Text color="fg.muted">{p.text}</Text>
            </Card>
          ))}
        </SimpleGrid>
        <Flex justify="center" mt="6">
          <Button asChild variant="outline" rounded="full" minH="11">
            <RouterLink to="/pricing">Compare all plans</RouterLink>
          </Button>
        </Flex>
      </section>

      <Card textAlign="center" p={{ base: '8', md: '12' }} bg="brand.solid" color="brand.contrast" borderColor="brand.solid">
        <Heading size="3xl" mb="3">
          Ready to be unreachable (professionally)?
        </Heading>
        <Text mb="6">Set up your first PTO in under two minutes. 🏝️</Text>
        <Button asChild size="lg" rounded="full" minH="11" bg="bg.panel" color="fg">
          <RouterLink to="/register">Create your free account</RouterLink>
        </Button>
      </Card>

      <Flex as="footer" justify="space-between" wrap="wrap" gap="3" color="fg.muted" fontSize="sm" pb="4">
        <Text>🦥 PTOShield AI. All rights reserved, vacation days included.</Text>
        <Flex gap="4">
          <RouterLink to="/pricing">Pricing</RouterLink>
          <RouterLink to="/login">Log in</RouterLink>
          <RouterLink to="/register">Sign up</RouterLink>
        </Flex>
      </Flex>
    </Stack>
  )
}
