import { useCallback, useState } from 'react'
import { AVAILABILITY_KEY, loadIncludeAvailability, loadTone, TONE_KEY, writePref } from '../lib/prefs'
import type { ReplyTone } from '../types'

// Last used tone and the "include my backup + return date" option, remembered across visits.
export function useReplyPrefs() {
  const [tone, setToneState] = useState<ReplyTone>(loadTone)
  const [includeAvailability, setIncludeState] = useState<boolean>(loadIncludeAvailability)

  const setTone = useCallback((t: ReplyTone) => {
    setToneState(t)
    writePref(TONE_KEY, t)
  }, [])
  const setIncludeAvailability = useCallback((v: boolean) => {
    setIncludeState(v)
    writePref(AVAILABILITY_KEY, String(v))
  }, [])

  return { tone, setTone, includeAvailability, setIncludeAvailability }
}
