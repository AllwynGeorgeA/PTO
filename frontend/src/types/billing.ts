import type { PlanId } from './index'

export interface CheckoutResult {
  demo: boolean
  checkout_url: string | null
  message?: string
}

export interface Subscription {
  plan: PlanId
  status: string
  current_period_end: string | null
  demo: boolean
}
