import { Link, Stack } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'

export interface NavItem {
  to: string
  label: string
}

export function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <Stack gap="1">
      {items.map((item) => (
        <Link
          asChild
          key={item.to}
          px="4"
          py="2"
          rounded="full"
          fontWeight="medium"
          textDecoration="none"
          _hover={{ bg: 'brand.muted' }}
          _currentPage={{ bg: 'brand.muted', color: 'brand.fg' }}
        >
          <NavLink to={item.to} onClick={onNavigate}>
            {item.label}
          </NavLink>
        </Link>
      ))}
    </Stack>
  )
}
