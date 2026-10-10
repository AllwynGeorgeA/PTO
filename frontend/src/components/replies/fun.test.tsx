import { ChakraProvider } from '@chakra-ui/react'
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFun } from '../../hooks/useFun'
import { useReplyPrefs } from '../../hooks/useReplyPrefs'
import HandoverDashboardPage from '../../pages/HandoverDashboardPage'
import { system } from '../../theme'
import { TryItDemo } from '../landing/TryItDemo'
import { ReadinessMeter } from '../pto/ReadinessMeter'
import { FunProvider } from '../ui/Fun'
import { ReplyComposer } from './ReplyComposer'

vi.mock('../../services/handover', () => ({
  listTasks: vi.fn().mockResolvedValue([]),
  createTask: vi.fn().mockResolvedValue({}),
  toggleTask: vi.fn(),
  deleteTask: vi.fn(),
}))

const wrap = (ui: ReactElement) =>
  render(
    <ChakraProvider value={system}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ChakraProvider>,
  )

const setReducedMotion = (reduce: boolean) =>
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (q: string) => ({
      matches: reduce && q.includes('reduce'),
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  })

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  setReducedMotion(false)
  vi.restoreAllMocks()
})

describe('reply prefs memory', () => {
  it('remembers tone and include-availability across mounts', () => {
    const first = renderHook(() => useReplyPrefs())
    expect(first.result.current.tone).toBe('professional')
    act(() => {
      first.result.current.setTone('funny')
      first.result.current.setIncludeAvailability(true)
    })
    first.unmount()
    const second = renderHook(() => useReplyPrefs())
    expect(second.result.current.tone).toBe('funny')
    expect(second.result.current.includeAvailability).toBe(true)
  })

  it('ignores junk and survives storage that throws', () => {
    localStorage.setItem('reply_tone', 'not-a-tone')
    expect(renderHook(() => useReplyPrefs()).result.current.tone).toBe('professional')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useReplyPrefs())
    act(() => result.current.setTone('funny'))
    expect(result.current.tone).toBe('funny')
  })
})

describe('ReplyComposer', () => {
  const props = {
    message: 'hi',
    onMessage: vi.fn(),
    tone: 'professional' as const,
    onTone: vi.fn(),
    includeAvailability: false,
    onInclude: vi.fn(),
    busy: false,
  }
  it('generates on Ctrl+Enter and toggles availability', async () => {
    const onSubmit = vi.fn()
    wrap(<ReplyComposer {...props} onSubmit={onSubmit} />)
    fireEvent.keyDown(screen.getByLabelText('Colleague message'), { key: 'Enter', ctrlKey: true })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByLabelText(/Include my backup/))
    await waitFor(() => expect(props.onInclude).toHaveBeenCalledWith(true))
  })
  it('does not generate an empty message', () => {
    const onSubmit = vi.fn()
    wrap(<ReplyComposer {...props} message="  " onSubmit={onSubmit} />)
    fireEvent.keyDown(screen.getByLabelText('Colleague message'), { key: 'Enter', ctrlKey: true })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('Handover quick add', () => {
  it('creates a medium-priority task on Enter', async () => {
    const { createTask } = await import('../../services/handover')
    wrap(<HandoverDashboardPage />)
    const input = await screen.findByLabelText('New task name')
    fireEvent.change(input, { target: { value: 'Restart the thing' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Quick add task' }))
    await waitFor(() =>
      expect(createTask).toHaveBeenCalledWith({
        pto_plan_id: null,
        name: 'Restart the thing',
        description: null,
        priority: 'medium',
        backup_person: null,
        deadline: null,
      }),
    )
  })
})

describe('reduced motion', () => {
  it('renders final values immediately and bursts are no-ops', () => {
    setReducedMotion(true)
    function Probe() {
      const { burst } = useFun()
      return <button onClick={() => burst()}>boom</button>
    }
    wrap(
      <FunProvider>
        <ReadinessMeter score={85} message="Cleared" />
        <TryItDemo />
        <Probe />
      </FunProvider>,
    )
    expect(screen.getByText('85%', { selector: '[aria-hidden="true"]' })).toBeTruthy()
    expect(screen.getByText(/Hey, quick question/)).toBeTruthy()
    expect(screen.getByText(/PTOShield AI says/)).toBeTruthy()
    fireEvent.click(screen.getByText('boom'))
    expect(document.body.textContent).not.toContain('🎉')
  })
})
