import { Box, Button, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { MotionBox } from '../lib/motion'

const FEATURES = [
  { emoji: '🗓️', title: 'PTO Planner', text: 'Plan time off, track balances, and let the calendar do the guilt management.' },
  { emoji: '🤖', title: 'Funny AI Replies', text: 'Out-of-office messages that are professional, polite, and just a little bit smug.' },
  { emoji: '🤝', title: 'Handover Assistant', text: 'Hand off tasks cleanly so nobody pings you on a beach. Synergy, but chill.' },
  { emoji: '📊', title: 'Readiness Score', text: 'One number that says whether you are truly ready to disappear. Spoiler: aim for 100.' },
]

const STEPS = [
  { emoji: '1️⃣', title: 'Add your PTO', text: 'Pick your dates and tell us where the sunshine is.' },
  { emoji: '2️⃣', title: 'Hand over your tasks', text: 'List what is in flight and who catches it.' },
  { emoji: '3️⃣', title: 'Generate your reply', text: 'Get a ready-to-send out-of-office in your tone of choice.' },
  { emoji: '4️⃣', title: 'Switch off', text: 'Check your readiness score, then enjoy your peace.' },
]

const PLANS = [
  { name: 'Free', price: '$0', text: 'Plan PTO and try the basics.' },
  { name: 'Pro', price: '$4.99', text: 'Unlimited AI replies and handover tools.', highlight: true },
  { name: 'Team', price: '$19', text: 'Shared handovers for the whole crew.' },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

export default function HomePage() {
  return (
    <Stack gap={{ base: '16', md: '24' }}>
      <Stack as="section" align="center" textAlign="center" gap="6" pt={{ base: '8', md: '16' }} maxW="3xl" mx="auto">
        <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} fontSize="6xl" aria-hidden="true">
          🏝️
        </MotionBox>
        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Heading as="h1" size={{ base: '3xl', md: '5xl' }} lineHeight="1.1">
            Your PTO is approved.{' '}
            <Text as="span" bgGradient="to-r" gradientFrom="ocean.400" gradientTo="sunset.400" bgClip="text">
              Your peace is protected.
            </Text>{' '}
            😂
          </Heading>
        </MotionBox>
        <Text fontSize={{ base: 'md', md: 'xl' }} color="fg.muted">
          PTOShield AI plans your time off, drafts witty out-of-office replies, and hands over your work, so you can
          actually unplug.
        </Text>
        <Flex gap="3" wrap="wrap" justify="center">
          <GradientButton asChild size="lg">
            <RouterLink to="/register">Start free 🌴</RouterLink>
          </GradientButton>
          <Button asChild size="lg" variant="outline" rounded="full">
            <RouterLink to="/pricing">See pricing</RouterLink>
          </Button>
        </Flex>
      </Stack>

      <Box as="section" aria-labelledby="features-heading">
        <Heading id="features-heading" size="3xl" textAlign="center" mb="8">
          Everything between you and the beach 🏖️
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="5">
          {FEATURES.map((f) => (
            <GlassCard key={f.title}>
              <Text fontSize="4xl" aria-hidden="true">
                {f.emoji}
              </Text>
              <Heading size="lg" mt="2" mb="2">
                {f.title}
              </Heading>
              <Text color="fg.muted">{f.text}</Text>
            </GlassCard>
          ))}
        </SimpleGrid>
      </Box>

      <Box as="section" aria-labelledby="how-heading">
        <Heading id="how-heading" size="3xl" textAlign="center" mb="8">
          How it works 🧭
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="5">
          {STEPS.map((s) => (
            <MotionBox key={s.title} {...fadeUp} p="6" borderRadius="card" borderWidth="1px" borderColor="border" bg="surface">
              <Text fontSize="3xl" aria-hidden="true">
                {s.emoji}
              </Text>
              <Heading size="md" mt="2" mb="1">
                {s.title}
              </Heading>
              <Text color="fg.muted">{s.text}</Text>
            </MotionBox>
          ))}
        </SimpleGrid>
      </Box>

      <Box as="section" aria-labelledby="pricing-heading">
        <Heading id="pricing-heading" size="3xl" textAlign="center" mb="2">
          Pricing that will not need approval 💸
        </Heading>
        <Text textAlign="center" color="fg.muted" mb="8">
          Cheaper than one overpriced airport sandwich.
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="5" maxW="4xl" mx="auto">
          {PLANS.map((p) => (
            <GlassCard key={p.name} borderColor={p.highlight ? 'ocean.400' : 'border'} borderWidth={p.highlight ? '2px' : '1px'}>
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
            </GlassCard>
          ))}
        </SimpleGrid>
        <Flex justify="center" mt="6">
          <Button asChild variant="outline" rounded="full">
            <RouterLink to="/pricing">Compare all plans</RouterLink>
          </Button>
        </Flex>
      </Box>

      <MotionBox
        as="section"
        {...fadeUp}
        textAlign="center"
        p={{ base: '8', md: '12' }}
        borderRadius="card"
        bgGradient="to-r"
        gradientFrom="ocean.500"
        gradientTo="sunset.400"
        color="white"
      >
        <Heading size="3xl" mb="3">
          Ready to be unreachable (professionally)?
        </Heading>
        <Text mb="6">Set up your first PTO in under two minutes.</Text>
        <Button asChild size="lg" rounded="full" bg="white" color="ocean.700">
          <RouterLink to="/register">Create your free account</RouterLink>
        </Button>
      </MotionBox>

      <Flex as="footer" justify="space-between" wrap="wrap" gap="3" color="fg.muted" fontSize="sm" pb="4">
        <Text>🛡️ PTOShield AI. All rights reserved, vacation days included.</Text>
        <Flex gap="4">
          <RouterLink to="/pricing">Pricing</RouterLink>
          <RouterLink to="/login">Log in</RouterLink>
          <RouterLink to="/register">Sign up</RouterLink>
        </Flex>
      </Flex>
    </Stack>
  )
}
