import type { BillingInfo } from '../types'
import type { CheckoutResult } from '../types/billing'
import api from './api'

// Accepts {plans, demo} or a bare Plan[] (demo then unknown -> assume true, the safe label).
export async function getPlans(): Promise<BillingInfo> {
  const { data } = await api.get<BillingInfo | BillingInfo['plans']>('/billing/plans')
  return Array.isArray(data) ? { plans: data, demo: true } : data
}

export async function checkout(plan: 'pro' | 'team'): Promise<CheckoutResult> {
  const { data } = await api.post<CheckoutResult>('/billing/checkout', { plan })
  return data
}
