import { Box, Button, Flex } from '@chakra-ui/react'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'

export function PublicLayout() {
  const { user } = useAuth()
  return (
    <Box minH="100vh">
      <Flex as="nav" aria-label="Site" align="center" justify="space-between" wrap="wrap" gap="2" px={{ base: '4', md: '10' }} py="4">
        <Logo to="/" />
        <Flex align="center" gap="2">
          <Button asChild variant="ghost" rounded="full">
            <RouterLink to="/pricing">Pricing</RouterLink>
          </Button>
          {user ? (
            <Button asChild rounded="full">
              <RouterLink to="/dashboard">Dashboard</RouterLink>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" rounded="full">
                <RouterLink to="/login">Log in</RouterLink>
              </Button>
              <Button asChild rounded="full">
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
