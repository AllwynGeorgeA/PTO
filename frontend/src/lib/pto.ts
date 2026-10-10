import { isAxiosError } from 'axios'
import type { PtoFormErrors, PtoFormValues, ReadinessTier } from '../types/pto'
import type { PtoStatus } from '../types'

export const STATUS_LABEL: Record<PtoStatus, string> = {
  upcoming: 'Upcoming',
  active: 'Active',
  completed: 'Completed',
}

export const STATUS_COLOR: Record<PtoStatus, string> = {
  upcoming: 'blue',
  active: 'green',
  completed: 'gray',
}

const plural = (n: number): string => `${n} ${n === 1 ? 'day' : 'days'}`

// Headline countdown text for a plan. dayNumber is the 1-based day of leave when active.
export function countdownText(status: PtoStatus, daysRemaining: number, dayNumber?: number): string {
  if (status === 'upcoming') return daysRemaining <= 0 ? 'Starts today 🏝️' : `${plural(daysRemaining)} until freedom 🏝️`
  if (status === 'active') return `Day ${dayNumber ?? 1} of your leave`
  return 'Welcome back 👋'
}

export function readinessTier(score: number): ReadinessTier {
  if (score <= 30) return { label: 'Not ready', emoji: '🚨', color: 'red' }
  if (score <= 70) return { label: 'Getting there', emoji: '😅', color: 'orange' }
  return { label: 'Vacation ready', emoji: '🏝️', color: 'green' }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validatePto(v: PtoFormValues): PtoFormErrors {
  const e: PtoFormErrors = {}
  if (!v.employee_name.trim()) e.employee_name = 'Name is required'
  if (!v.start_date) e.start_date = 'Start date is required'
  if (!v.end_date) e.end_date = 'End date is required'
  else if (v.start_date && v.end_date < v.start_date) e.end_date = 'End date must be on or after the start date'
  if (!v.backup_person.trim()) e.backup_person = 'Backup person is required'
  if (!v.contact_email.trim()) e.contact_email = 'Contact email is required'
  else if (!EMAIL_RE.test(v.contact_email.trim())) e.contact_email = 'Enter a valid email address'
  return e
}

export function errorMessage(err: unknown): string {
  if (isAxiosError<{ detail?: unknown }>(err)) {
    const d = err.response?.data?.detail
    if (typeof d === 'string') return d
    if (err.response?.status === 422) return 'Please check the dates and fields and try again.'
  }
  return 'Something went wrong. Please try again.'
}

export const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
