import { Box, Button, Flex, Heading, IconButton, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle } from '../ui/ThemeToggle'
import { NavLinks, type NavItem } from './NavLinks'

const baseItems: NavItem[] = [
  { to: '/dashboard', label: '🏝️ Dashboard' },
  { to: '/pto', label: '📅 PTO Plans' },
  { to: '/replies/new', label: '✉️ Auto-Replies' },
  { to: '/replies', label: '💾 Saved Replies' },
  { to: '/handover', label: '📋 Handover' },
  { to: '/settings', label: '⚙️ Settings' },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const sidebar = (
    <Flex direction="column" gap="6" h="full">
      <Heading size="lg" color="brand.fg">
        🛡️ PTOShield AI
      </Heading>
      <NavLinks items={baseItems} onNavigate={() => setOpen(false)} />
      <Box mt="auto">
        <Text fontSize="sm" color="fg.muted" mb="2" truncate>
          {user?.email}
        </Text>
        <Button size="sm" variant="outline" rounded="full" onClick={handleLogout}>
          Log out
        </Button>
      </Box>
    </Flex>
  )

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      <Flex display={{ base: 'flex', md: 'none' }} align="center" justify="space-between" p="3" borderBottomWidth="1px" borderColor="border">
        <Heading size="md" color="brand.fg">
          🛡️ PTOShield AI
        </Heading>
        <Flex gap="1">
          <ThemeToggle />
          <IconButton aria-label="Toggle menu" variant="ghost" rounded="full" onClick={() => setOpen((o) => !o)}>
            {open ? '✕' : '☰'}
          </IconButton>
        </Flex>
      </Flex>

      <Box
        display={{ base: open ? 'block' : 'none', md: 'block' }}
        w={{ base: 'full', md: '64' }}
        flexShrink={0}
        p="5"
        borderRightWidth={{ base: '0', md: '1px' }}
        borderColor="border"
        bg="surface"
      >
        {sidebar}
      </Box>

      <Box flex="1" minW="0">
        <Flex display={{ base: 'none', md: 'flex' }} justify="flex-end" p="3">
          <ThemeToggle />
        </Flex>
        <Box p={{ base: '4', md: '8' }}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}
