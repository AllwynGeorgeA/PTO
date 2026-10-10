import { ChakraProvider } from '@chakra-ui/react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { system } from '../../theme'
import { CopyButton } from '../ui/CopyButton'
import { TonePicker } from './TonePicker'
import { UpgradePrompt } from './UpgradePrompt'
import TaskFormPage from '../../pages/TaskFormPage'

vi.mock('../../services/handover', () => ({ createTask: vi.fn(), updateTask: vi.fn(), getTask: vi.fn(), listTasks: vi.fn() }))
vi.mock('../../hooks/usePtoPlans', () => ({ usePtoPlans: () => ({ plans: [], loading: false, error: null, reload: vi.fn() }) }))

const wrap = (ui: ReactElement) =>
  render(
    <ChakraProvider value={system}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ChakraProvider>,
  )

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('CopyButton', () => {
  it('writes to the clipboard and shows feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    wrap(<CopyButton text="hello" />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('Copied'))
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('reports failure when no clipboard path works', async () => {
    Object.assign(navigator, { clipboard: undefined })
    document.execCommand = vi.fn().mockReturnValue(false)
    wrap(<CopyButton text="hello" />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('button').textContent).toContain('failed'))
  })
})

describe('TonePicker', () => {
  it('renders 4 tones and reports selection', () => {
    const onChange = vi.fn()
    wrap(<TonePicker value="professional" onChange={onChange} />)
    expect(screen.getAllByRole('radio')).toHaveLength(4)
    expect(screen.getByRole('radio', { name: /Professional/ }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(screen.getByRole('radio', { name: /Funny/ }))
    expect(onChange).toHaveBeenCalledWith('funny')
  })
})

describe('UpgradePrompt', () => {
  it('links to /pricing', () => {
    wrap(<UpgradePrompt />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Upgrade/ }).getAttribute('href')).toBe('/pricing')
  })
})

describe('TaskFormPage', () => {
  it('blocks submit and shows an error when the name is empty', async () => {
    const { createTask } = await import('../../services/handover')
    wrap(<TaskFormPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
    await waitFor(() => expect(screen.getByText(/Task name is required/)).toBeTruthy())
    expect(createTask).not.toHaveBeenCalled()
  })
})
