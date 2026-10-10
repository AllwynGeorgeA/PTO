import type { ReplyTone } from '../types'
import { TONE_OPTIONS } from '../types/replies'

// localStorage can throw (private mode, blocked storage); never let that break the UI.
export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore: preferences are a convenience only
  }
}

export const TONE_KEY = 'reply_tone'
export const AVAILABILITY_KEY = 'reply_include_availability'

export function loadTone(): ReplyTone {
  const saved = readPref(TONE_KEY)
  return TONE_OPTIONS.find((t) => t.value === saved)?.value ?? 'professional'
}

export const loadIncludeAvailability = (): boolean => readPref(AVAILABILITY_KEY) === 'true'
