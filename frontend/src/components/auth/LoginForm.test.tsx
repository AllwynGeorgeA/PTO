import { ChakraProvider } from '@chakra-ui/react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'
import { system } from '../../theme'

const login = vi.fn<(email: string, password: string) => Promise<void>>()

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login }) }))

const setup = () =>
  render(
    <ChakraProvider value={system}>
      <LoginForm />
    </ChakraProvider>,
  )

const submit = () => fireEvent.submit(screen.getByRole('form', { name: 'Log in' }))

describe('LoginForm', () => {
  afterEach(() => {
    cleanup()
    login.mockReset()
  })

  it('shows validation errors and does not call login for empty/invalid input', async () => {
    setup()
    submit()
    expect(await screen.findByText('Enter a valid email address')).toBeTruthy()
    expect(screen.getByText('Password is required')).toBeTruthy()
    expect(login).not.toHaveBeenCalled()
  })

  it('rejects a malformed email', async () => {
    setup()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nope' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
    submit()
    expect(await screen.findByText('Enter a valid email address')).toBeTruthy()
    expect(login).not.toHaveBeenCalled()
  })

  it('calls login with valid input', async () => {
    login.mockResolvedValue()
    setup()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.co' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
    submit()
    await waitFor(() => expect(login).toHaveBeenCalledWith('a@b.co', 'secret123'))
  })
})
