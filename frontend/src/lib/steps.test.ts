import { describe, expect, it } from 'vitest'
import type { DashboardData, PtoPlan } from '../types'
import { greeting, unreachableText } from './fun'
import { buildSteps, nextStep } from './steps'

const plan: PtoPlan = {
  id: 7,
  employee_name: 'Sam',
  start_date: '2026-07-01',
  end_date: '2026-07-10',
  backup_person: 'Alex',
  contact_email: 'a@b.co',
  reason: null,
  status: 'upcoming',
  days_remaining: 12,
  created_at: '2026-06-01',
}
const base: DashboardData = {
  next_pto: null,
  days_remaining: null,
  saved_reply_count: 0,
  pending_task_count: 0,
  readiness_score: 0,
  readiness_message: '',
}

describe('next-step checklist', () => {
  it('starts with planning PTO when there is no plan', () => {
    const steps = buildSteps(base, 0, 0)
    expect(steps.map((s) => s.done)).toEqual([false, false, false, false])
    expect(nextStep(steps)?.id).toBe('plan')
    expect(nextStep(steps)?.to).toBe('/pto/new')
  })

  it('marks plan + backup done and points at handover tasks next', () => {
    const steps = buildSteps({ ...base, next_pto: plan }, 0, 0)
    expect(steps.map((s) => s.done)).toEqual([true, true, false, false])
    expect(nextStep(steps)?.id).toBe('handover')
  })

  it('points at the backup step (edit form) when the backup is blank', () => {
    const steps = buildSteps({ ...base, next_pto: { ...plan, backup_person: ' ' } }, 0, 0)
    expect(nextStep(steps)?.id).toBe('backup')
    expect(nextStep(steps)?.to).toBe('/pto/7/edit')
  })

  it('treats saved replies or past usage as a generated reply, and finishes when all done', () => {
    expect(buildSteps({ ...base, next_pto: plan }, 2, 3)[3].done).toBe(true)
    expect(buildSteps({ ...base, next_pto: plan, saved_reply_count: 1 }, 2, 0)[3].done).toBe(true)
    expect(nextStep(buildSteps({ ...base, next_pto: plan }, 2, 3))).toBeUndefined()
  })
})

describe('funny copy', () => {
  it('greeting changes with readiness and proximity', () => {
    expect(greeting(100, 5)).toContain('Fully shielded')
    expect(greeting(20, 2)).toContain('Panic')
    expect(greeting(80, 30)).toContain('Almost there')
    expect(greeting(50, 30)).toContain('Getting there')
    expect(greeting(10, null)).toContain('Not ready')
  })
  it('countdown caption', () => {
    expect(unreachableText('upcoming', 12)).toBe("12 days until you're officially unreachable 🏝️")
    expect(unreachableText('upcoming', 0)).toContain('Today you vanish')
    expect(unreachableText('active', 0, 3)).toContain('Day 3')
  })
})
