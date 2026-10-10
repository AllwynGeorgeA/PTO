import type { TaskPriority, TaskStatus } from './index'

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'high', label: 'High 🔥', color: 'accent' },
  { value: 'medium', label: 'Medium', color: 'brand' },
  { value: 'low', label: 'Low 🧊', color: 'gray' },
]

export const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Done' },
]

export interface TaskFormValues {
  name: string
  description: string
  priority: TaskPriority
  backup_person: string
  deadline: string
  pto_plan_id: string
}

export type TaskErrors = Partial<Record<'name' | 'deadline', string>>

export function validateTask(v: TaskFormValues): TaskErrors {
  const errors: TaskErrors = {}
  if (!v.name.trim()) errors.name = 'Task name is required. Even "figure it out" counts.'
  else if (v.name.length > 200) errors.name = 'Keep the name under 200 characters.'
  if (v.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(v.deadline)) errors.deadline = 'Use a valid date.'
  return errors
}
