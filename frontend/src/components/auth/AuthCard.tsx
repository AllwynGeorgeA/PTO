import { Box, Heading, Stack, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { GlassCard } from '../ui/GlassCard'
import { GoogleLoginButton } from './GoogleLoginButton'

interface AuthCardProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <Box maxW="md" mx="auto" mt={{ base: '4', md: '12' }}>
      <GlassCard>
        <Stack gap="5">
          <Box>
            <Heading size="2xl">{title}</Heading>
            <Text color="fg.muted" mt="1">
              {subtitle}
            </Text>
          </Box>
          <GoogleLoginButton />
          <Text color="fg.muted" fontSize="sm" textAlign="center">
            or use your email
          </Text>
          {children}
          <Text fontSize="sm" textAlign="center">
            {footer}
          </Text>
        </Stack>
      </GlassCard>
    </Box>
  )
}
