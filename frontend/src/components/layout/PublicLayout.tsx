import { Box, Button, Flex, Heading } from '@chakra-ui/react'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle } from '../ui/ThemeToggle'
import { MeshBackground } from './MeshBackground'

export function PublicLayout() {
  const { user } = useAuth()
  return (
    <Box minH="100vh">
      <MeshBackground />
      <Flex as="nav" align="center" justify="space-between" wrap="wrap" gap="2" px={{ base: '4', md: '10' }} py="4">
        <Heading size="lg" color="brand.fg" asChild>
          <RouterLink to="/">🛡️ PTOShield AI</RouterLink>
        </Heading>
        <Flex align="center" gap="2">
          <Button asChild variant="ghost" rounded="full">
            <RouterLink to="/pricing">Pricing</RouterLink>
          </Button>
          {user ? (
            <Button asChild rounded="full" colorPalette="brand">
              <RouterLink to="/dashboard">Dashboard</RouterLink>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" rounded="full">
                <RouterLink to="/login">Log in</RouterLink>
              </Button>
              <Button asChild rounded="full" colorPalette="brand">
                <RouterLink to="/register">Sign up</RouterLink>
              </Button>
            </>
          )}
          <ThemeToggle />
        </Flex>
      </Flex>
      <Box px={{ base: '4', md: '10' }} pb="10">
        <Outlet />
      </Box>
    </Box>
  )
}
