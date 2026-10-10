import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { User } from '../../types'
import { ProtectedRoute } from './ProtectedRoute'

const auth: { user: User | null; isLoading: boolean } = { user: null, isLoading: false }

vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }))

const user = (is_admin: boolean): User => ({
  id: 1,
  email: 'a@b.co',
  full_name: 'A',
  is_admin,
  is_active: true,
  plan: 'free',
})

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<div>secret page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('ProtectedRoute', () => {
  afterEach(() => {
    cleanup()
    auth.user = null
    auth.isLoading = false
  })

  it('redirects anonymous users to /login', () => {
    renderAt('/secret')
    expect(screen.getByText('login page')).toBeTruthy()
  })

  it('renders the page for a logged-in user', () => {
    auth.user = user(false)
    renderAt('/secret')
    expect(screen.getByText('secret page')).toBeTruthy()
  })
})
