import { Box, Heading, Progress, Text } from '@chakra-ui/react'
import { readinessTier } from '../../lib/pto'

export function ReadinessMeter({ score, message }: { score: number; message: string }) {
  const tier = readinessTier(score)
  return (
    <Box data-testid="readiness">
      <Heading size="md" mb="3">
        Vacation Readiness Score
      </Heading>
      <Heading size="4xl" color={`${tier.color}.500`} mb="2">
        <span aria-hidden="true">{tier.emoji} </span>
        {score}%
      </Heading>
      <Progress.Root value={score} max={100} colorPalette={tier.color} aria-label="Vacation readiness score" size="lg">
        <Progress.Track rounded="full">
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
      <Text mt="3" fontWeight="semibold">
        {tier.label}
      </Text>
      <Text color="fg.muted">{message}</Text>
    </Box>
  )
}
