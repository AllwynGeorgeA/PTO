import { ChakraProvider } from '@chakra-ui/react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PricingPage from './PricingPage'
import { system } from '../theme'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, email: 'a@b.co', full_name: null, is_admin: false, is_active: true, plan: 'free' } }),
}))
vi.mock('../services/billing', () => ({
  getPlans: vi.fn().mockResolvedValue({
    demo: true,
    plans: [
      { id: 'free', name: 'Free', price: 0, features: ['5 replies'] },
      { id: 'pro', name: 'Pro', price: 4.99, features: ['Unlimited'] },
      { id: 'team', name: 'Team', price: 19, features: ['10 users'] },
    ],
  }),
  checkout: vi.fn().mockResolvedValue({ demo: true, checkout_url: null, message: 'Demo checkout: nothing changed.' }),
}))

afterEach(cleanup)

describe('PricingPage', () => {
  it('shows demo banner and never an upgraded state after demo checkout', async () => {
    render(
      <ChakraProvider value={system}>
        <MemoryRouter>
          <PricingPage />
        </MemoryRouter>
      </ChakraProvider>,
    )
    expect(await screen.findByText(/Demo mode: payments are not connected/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Choose Pro plan' }))
    expect(await screen.findByText('Demo checkout: nothing changed.')).toBeTruthy()
    expect(screen.queryByText(/upgraded/i)).toBeNull()
    expect(screen.getAllByText('Current plan').length).toBeGreaterThan(0)
    expect(screen.getByText('Most popular')).toBeTruthy()
  })
})
