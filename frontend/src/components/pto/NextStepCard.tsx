import { Box, Heading, HStack, Stack, Text, VisuallyHidden } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { nextStep, type Step } from '../../lib/steps'
import { Card } from '../ui/Card'
import { PrimaryButton } from '../ui/PrimaryButton'

// Checklist with the next undone step highlighted as the one big button.
export function NextStepCard({ steps }: { steps: Step[] }) {
  const next = nextStep(steps)
  const doneCount = steps.filter((s) => s.done).length
  return (
    <Card aria-label="Next step">
      <HStack justify="space-between" mb="4" wrap="wrap">
        <Heading size="lg">{next ? 'Your next step 👣' : 'All done! 🎉'}</Heading>
        <Text color="fg.muted" fontSize="sm">
          {doneCount}/{steps.length} done
        </Text>
      </HStack>
      <Stack as="ol" listStyleType="none" m="0" p="0" gap="2" mb="5">
        {steps.map((s, i) => {
          const current = s.id === next?.id
          return (
            <HStack
              as="li"
              key={s.id}
              gap="3"
              p="2"
              rounded="lg"
              bg={current ? 'brand.subtle' : 'transparent'}
              borderWidth="1px"
              borderColor={current ? 'brand.border' : 'transparent'}
              aria-current={current ? 'step' : undefined}
            >
              <Box
                aria-hidden="true"
                boxSize="8"
                rounded="full"
                display="grid"
                placeItems="center"
                fontWeight="bold"
                bg={s.done ? 'brand.solid' : 'bg.muted'}
                color={s.done ? 'brand.contrast' : 'fg.muted'}
              >
                {s.done ? '✓' : i + 1}
              </Box>
              <Text flex="1" fontWeight={current ? 'semibold' : 'normal'} textDecoration={s.done ? 'line-through' : 'none'} color={s.done ? 'fg.muted' : 'fg'}>
                {s.emoji} {s.title}
              </Text>
              <VisuallyHidden>{s.done ? 'done' : current ? 'next' : 'to do'}</VisuallyHidden>
            </HStack>
          )
        })}
      </Stack>
      {next ? (
        <PrimaryButton asChild size="lg" w={{ base: 'full', sm: 'auto' }}>
          <Link to={next.to}>{next.cta}</Link>
        </PrimaryButton>
      ) : (
        <PrimaryButton asChild size="lg" w={{ base: 'full', sm: 'auto' }}>
          <Link to="/replies/new">Write another excuse ✉️</Link>
        </PrimaryButton>
      )}
    </Card>
  )
}
