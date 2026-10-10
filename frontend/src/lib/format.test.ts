import { describe, expect, it } from 'vitest'
import { daysUntil } from './format'

describe('daysUntil', () => {
  const today = new Date(2026, 5, 10, 15, 30)
  it('counts forward, zero and backward', () => {
    expect(daysUntil('2026-06-15', today)).toBe(5)
    expect(daysUntil('2026-06-10', today)).toBe(0)
    expect(daysUntil('2026-06-09', today)).toBe(-1)
  })
})
