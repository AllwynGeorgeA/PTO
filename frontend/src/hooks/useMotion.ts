import { animate } from 'framer-motion'
import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

// True unless the user asked for reduced motion. Gate every burst, wiggle and count-up on this.
export function useMotionOk(): boolean {
  const [ok, setOk] = useState(() => !window.matchMedia?.(QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia?.(QUERY)
    if (!mq) return
    const onChange = () => setOk(!mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return ok
}

// Counts 0 -> target; returns the target straight away under reduced motion.
export function useCountUp(target: number, seconds = 0.9): number {
  const ok = useMotionOk()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!ok) return
    const controls = animate(0, target, { duration: seconds, ease: 'easeOut', onUpdate: (v) => setN(Math.round(v)) })
    return () => controls.stop()
  }, [target, seconds, ok])
  return ok ? n : target
}
