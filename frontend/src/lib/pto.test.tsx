import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReadinessMeter } from '../components/pto/ReadinessMeter'
import { system } from '../theme'
import { countdownText, readinessTier, validatePto } from './pto'

const ok = {
  employee_name: 'Sam',
  start_date: '2026-07-01',
  end_date: '2026-07-10',
  backup_person: 'Alex',
  contact_email: 'a@b.co',
  reason: '',
}

describe('countdownText', () => {
  it('covers each status', () => {
    expect(countdownText('upcoming', 5)).toBe('5 days until freedom 🏝️')
    expect(countdownText('upcoming', 1)).toBe('1 day until freedom 🏝️')
    expect(countdownText('active', 3, 4)).toBe('Day 4 of your leave')
    expect(countdownText('completed', 0)).toContain('Welcome back')
  })
})

describe('validatePto', () => {
  it('accepts valid input', () => expect(validatePto(ok)).toEqual({}))
  it('rejects end before start', () => {
    expect(validatePto({ ...ok, end_date: '2026-06-30' }).end_date).toMatch(/on or after/)
  })
  it('rejects bad email and empty required fields', () => {
    expect(validatePto({ ...ok, contact_email: 'nope' }).contact_email).toMatch(/valid email/)
    expect(validatePto({ ...ok, employee_name: ' ' }).employee_name).toBeDefined()
  })
})

describe('readiness tiers', () => {
  it('maps boundaries', () => {
    expect(readinessTier(30).color).toBe('accent')
    expect(readinessTier(31).color).toBe('gray')
    expect(readinessTier(70).color).toBe('gray')
    expect(readinessTier(71).color).toBe('brand')
  })
  it('renders score, emoji and message', () => {
    render(
      <ChakraProvider value={system}>
        <ReadinessMeter score={85} message="Cleared for takeoff" />
      </ChakraProvider>,
    )
    expect(screen.getByTestId('readiness').textContent).toContain('85%')
    expect(screen.getByText('Cleared for takeoff')).toBeTruthy()
    expect(screen.getByTestId('readiness').textContent).toContain('🏝️')
  })
})
