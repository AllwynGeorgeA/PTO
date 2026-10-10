import { isAxiosError } from 'axios'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const emailError = (email: string): string | null =>
  EMAIL_RE.test(email.trim()) ? null : 'Enter a valid email address'

export const passwordError = (password: string): string | null =>
  password.length >= 8 ? null : 'Password must be at least 8 characters'

// Backend errors look like {error, detail}; 422 detail may be a list, so only show string details.
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError<{ detail?: unknown }>(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (err.response?.status === 409) return 'That email is already registered'
    if (err.response?.status === 401) return 'Incorrect email or password'
  }
  return fallback
}
