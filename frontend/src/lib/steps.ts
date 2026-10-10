import type { DashboardData } from '../types'

export interface Step {
  id: 'plan' | 'backup' | 'handover' | 'reply'
  title: string
  emoji: string
  done: boolean
  to: string
  cta: string
}

// Checklist derived from existing data: dashboard + handover task count + reply usage.
export function buildSteps(data: DashboardData, taskCount: number, repliesUsed: number): Step[] {
  const plan = data.next_pto
  const hasBackup = plan !== null && plan.backup_person.trim() !== ''
  return [
    { id: 'plan', title: 'Plan your PTO', emoji: '🧳', done: plan !== null, to: '/pto/new', cta: 'Plan my escape 🧳' },
    {
      id: 'backup',
      title: 'Add a backup person',
      emoji: '🦸',
      done: hasBackup,
      to: plan ? `/pto/${plan.id}/edit` : '/pto/new',
      cta: 'Recruit a backup 🦸',
    },
    { id: 'handover', title: 'Add handover tasks', emoji: '📋', done: taskCount > 0, to: '/handover', cta: 'Dump your brain 📋' },
    {
      id: 'reply',
      title: 'Generate your first reply',
      emoji: '✉️',
      done: data.saved_reply_count > 0 || repliesUsed > 0,
      to: '/replies/new',
      cta: 'Write my excuse ✉️',
    },
  ]
}

export const nextStep = (steps: Step[]): Step | undefined => steps.find((s) => !s.done)
