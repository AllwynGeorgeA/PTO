import type { PtoStatus } from '../types'

export const OOPS = 'Oops, even our server took a PTO 🏖️'

export const LOADING_LINES = [
  'Asking the AI to stall your boss…',
  'Teaching the hamsters to type faster…',
  'Politely ignoring 47 unread emails…',
  'Counting what only you know…',
  'Finding your out-of-office voice…',
]

export const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]

// Dashboard headline: changes with readiness and how close the leave is.
export function greeting(score: number, daysRemaining: number | null): string {
  if (score >= 100) return 'Fully shielded. Go be unreachable. 🏝️'
  if (daysRemaining !== null && daysRemaining <= 3 && score <= 70) return 'Panic politely: the beach is close and the handover is not. 😅'
  if (score > 70) return 'Almost there. Your inbox will miss you (it will not). 🌴'
  if (score > 30) return 'Getting there. Keep going, the hammock is waiting. 🛋️'
  return 'Not ready yet. Your colleagues still know where you live. 🚨'
}

// Big-countdown caption under the number.
export function unreachableText(status: PtoStatus, days: number, dayNumber = 1): string {
  if (status === 'active') return `Day ${dayNumber} of your leave. Why are you on a dashboard? 🙃`
  if (status === 'completed') return 'Welcome back 👋 We are so sorry.'
  if (days <= 0) return 'Today you vanish. Out-of-office: ON 🏝️'
  if (days === 1) return '1 day until you are officially unreachable 🏝️'
  return `${days} days until you're officially unreachable 🏝️`
}

export const NOT_FOUND_JOKES = [
  'This page is on PTO. Its out-of-office says: "I will get back to you never."',
  'We looked everywhere. Even in the handover doc. Nothing.',
  'Error 404: page not found, but your readiness score is still doing great.',
]
