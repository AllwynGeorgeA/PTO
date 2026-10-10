// API contract: JSON fields are snake_case and mirror the backend schemas. Dates are ISO strings.
export type PlanId = 'free' | 'pro' | 'team'

export interface User {
  id: number
  email: string
  full_name: string | null
  is_admin: boolean
  is_active: boolean
  plan: PlanId
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Plan {
  id: PlanId
  name: string
  price: number
  features: string[]
}

export interface BillingInfo {
  plans: Plan[]
  demo: boolean
}

export type PtoStatus = 'upcoming' | 'active' | 'completed'

export interface PtoPlan {
  id: number
  employee_name: string
  start_date: string
  end_date: string
  backup_person: string
  contact_email: string
  reason: string | null
  status: PtoStatus
  days_remaining: number
  created_at: string
}

export type PtoPlanInput = Pick<
  PtoPlan,
  'employee_name' | 'start_date' | 'end_date' | 'backup_person' | 'contact_email' | 'reason'
>

export type ReplyTone = 'professional' | 'funny' | 'savage_office_safe' | 'corporate_diplomatic'
export type ReplySource = 'openai' | 'template'

export interface AiReply {
  id: number
  incoming_message: string
  tone: ReplyTone
  generated_reply: string
  is_saved: boolean
  source: ReplySource
  created_at: string
}

export interface ReplyUsage {
  used: number
  limit: number | null // null = unlimited
  plan: PlanId
}

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'pending' | 'completed'

export interface HandoverTask {
  id: number
  pto_plan_id: number | null
  name: string
  description: string | null
  priority: TaskPriority
  backup_person: string | null
  deadline: string | null
  status: TaskStatus
  created_at: string
}

export type HandoverTaskInput = Pick<
  HandoverTask,
  'pto_plan_id' | 'name' | 'description' | 'priority' | 'backup_person' | 'deadline'
>

export interface HandoverSummary {
  summary: string
  source: ReplySource
}

export interface DashboardData {
  next_pto: PtoPlan | null
  days_remaining: number | null
  saved_reply_count: number
  pending_task_count: number
  readiness_score: number
  readiness_message: string
}

export interface ApiErrorBody {
  error?: string
  detail: string
}
