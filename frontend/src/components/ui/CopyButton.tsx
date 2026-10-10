import { Button } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { copyText } from '../../lib/clipboard'

type State = 'idle' | 'copied' | 'failed'

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [state, setState] = useState<State>('idle')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onClick = async () => {
    setState((await copyText(text)) ? 'copied' : 'failed')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2000)
  }

  const caption = state === 'copied' ? '✅ Copied!' : state === 'failed' ? 'Copy failed, select manually' : `📋 ${label}`
  return (
    <Button size="sm" variant="outline" rounded="full" onClick={onClick} aria-live="polite">
      {caption}
    </Button>
  )
}
