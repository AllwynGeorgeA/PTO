import type { PtoPlan } from '.'

export type PtoFormValues = {
  employee_name: string
  start_date: string
  end_date: string
  backup_person: string
  contact_email: string
  reason: string
}

export type PtoFormErrors = Partial<Record<keyof PtoFormValues, string>>

export type ReadinessTier = { label: string; emoji: string; color: 'accent' | 'gray' | 'brand' }

export interface AsyncState<T> {
  data: T
  loading: boolean
  error: string | null
}

export type { PtoPlan }
