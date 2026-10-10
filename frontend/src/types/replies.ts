import type { ReplyTone } from './index'

export interface ToneOption {
  value: ReplyTone
  emoji: string
  label: string
  hint: string
}

export const TONE_OPTIONS: ToneOption[] = [
  { value: 'professional', emoji: '👔', label: 'Professional', hint: 'Polite and boring, in a good way' },
  { value: 'funny', emoji: '😂', label: 'Funny', hint: 'HR may or may not laugh' },
  { value: 'savage_office_safe', emoji: '😎', label: 'Savage (office safe)', hint: 'Sharp, but no incident report' },
  { value: 'corporate_diplomatic', emoji: '🕊️', label: 'Corporate diplomatic', hint: 'Says no without saying no' },
]

export const EXAMPLE_MESSAGES: string[] = [
  'Can you join a quick meeting during your vacation?',
  'Just a small question, you are the only one who knows this.',
  'Are you checking Slack on the beach?',
]

export interface ReplyUpdate {
  generated_reply?: string
  is_saved?: boolean
}
