import { Flex, Link, Stack, Text } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'

export interface NavItem {
  to: string
  label: string
  emoji: string
  end?: boolean
}

// Desktop sidebar list.
export function NavLinks({ items }: { items: NavItem[] }) {
  return (
    <Stack gap="1" as="nav" aria-label="Main">
      {items.map((item) => (
        <Link
          asChild
          key={item.to}
          px="4"
          py="2.5"
          rounded="full"
          fontWeight="medium"
          textDecoration="none"
          _hover={{ bg: 'brand.subtle' }}
          _currentPage={{ bg: 'brand.muted', color: 'brand.fg' }}
        >
          <NavLink to={item.to} end={item.end}>
            <span aria-hidden="true">{item.emoji}</span> {item.label}
          </NavLink>
        </Link>
      ))}
    </Stack>
  )
}

// Mobile bottom bar: big tap targets, active state highlighted.
export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <Flex
      as="nav"
      aria-label="Main"
      display={{ base: 'flex', md: 'none' }}
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      zIndex="sticky"
      bg="bg.panel"
      borderTopWidth="1px"
      borderColor="border"
      pb="env(safe-area-inset-bottom)"
    >
      {items.map((item) => (
        <Link
          asChild
          key={item.to}
          flex="1"
          minW="0"
          minH="14"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="0"
          textDecoration="none"
          color="fg.muted"
          _hover={{ textDecoration: 'none' }}
          _currentPage={{ color: 'brand.fg', bg: 'brand.subtle' }}
        >
          <NavLink to={item.to} end={item.end}>
            <Text fontSize="xl" lineHeight="1" aria-hidden="true">
              {item.emoji}
            </Text>
            <Text fontSize="xs" fontWeight="medium" truncate maxW="full">
              {item.label}
            </Text>
          </NavLink>
        </Link>
      ))}
    </Flex>
  )
}
