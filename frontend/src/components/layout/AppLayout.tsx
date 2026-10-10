import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { QuickReply } from '../replies/QuickReply'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { BottomNav, NavLinks, type NavItem } from './NavLinks'

const sidebarItems: NavItem[] = [
  { to: '/dashboard', emoji: '🏝️', label: 'Home' },
  { to: '/pto', emoji: '📅', label: 'PTO plans' },
  { to: '/replies/new', emoji: '✉️', label: 'Auto-replies' },
  { to: '/replies', emoji: '⭐', label: 'Saved replies', end: true },
  { to: '/handover', emoji: '📋', label: 'Handover' },
  { to: '/settings', emoji: '⚙️', label: 'Settings' },
]

// Mobile gets the 5 main routes.
const bottomItems: NavItem[] = [
  { to: '/dashboard', emoji: '🏝️', label: 'Home' },
  { to: '/pto', emoji: '📅', label: 'PTO' },
  { to: '/replies/new', emoji: '✉️', label: 'Replies' },
  { to: '/handover', emoji: '📋', label: 'Tasks' },
  { to: '/settings', emoji: '⚙️', label: 'Settings' },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      <Flex display={{ base: 'flex', md: 'none' }} align="center" justify="space-between" px="4" py="2" borderBottomWidth="1px" borderColor="border">
        <Logo to="/dashboard" />
        <ThemeToggle />
      </Flex>

      <Flex
        display={{ base: 'none', md: 'flex' }}
        direction="column"
        gap="6"
        w="64"
        flexShrink={0}
        p="5"
        borderRightWidth="1px"
        borderColor="border"
        bg="surface"
        position="sticky"
        top="0"
        h="100vh"
      >
        <Logo to="/dashboard" />
        <NavLinks items={sidebarItems} />
        <Box mt="auto">
          <Text fontSize="sm" color="fg.muted" mb="2" truncate>
            {user?.email}
          </Text>
          <Button size="sm" variant="outline" rounded="full" onClick={handleLogout}>
            Log out 👋
          </Button>
        </Box>
      </Flex>

      <Box flex="1" minW="0">
        <Flex display={{ base: 'none', md: 'flex' }} justify="flex-end" p="3">
          <ThemeToggle />
        </Flex>
        <Box p={{ base: '4', md: '8' }} pb={{ base: '36', md: '24' }} maxW="5xl">
          <Outlet />
        </Box>
      </Box>

      <QuickReply />
      <BottomNav items={bottomItems} />
    </Flex>
  )
}
