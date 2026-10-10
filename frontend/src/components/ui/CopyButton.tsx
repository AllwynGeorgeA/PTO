import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useMotionOk } from '../../hooks/useMotion'
import { copyText } from '../../lib/clipboard'
import { MotionButton } from '../../lib/motion'
import { useFun } from '../../hooks/useFun'
import { toastError, toastOk } from '../../lib/toast'

type State = 'idle' | 'copied' | 'failed'

export function CopyButton({
  text,
  label = 'Copy',
  doneToast = 'Copied! Go ghost them 👻',
}: {
  text: string
  label?: string
  doneToast?: string
}) {
  const [state, setState] = useState<State>('idle')
  const timer = useRef<number | undefined>(undefined)
  const { burst } = useFun()
  const ok = useMotionOk()
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onClick = async (e: MouseEvent<HTMLButtonElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const success = await copyText(text)
    setState(success ? 'copied' : 'failed')
    if (success) {
      burst({ x: box.left + box.width / 2, y: box.top })
      toastOk(doneToast)
    } else {
      toastError('Copy failed. Select the text and copy it the old-fashioned way. 📜')
    }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2000)
  }

  const caption = state === 'copied' ? '✅ Copied!' : state === 'failed' ? 'Copy failed, select manually' : `📋 ${label}`
  return (
    <MotionButton
      size="sm"
      variant="outline"
      rounded="full"
      minH="11"
      onClick={onClick}
      aria-live="polite"
      whileHover={ok ? { scale: 1.06 } : undefined}
      whileTap={ok ? { scale: 0.9, rotate: -3 } : undefined}
    >
      {caption}
    </MotionButton>
  )
}
