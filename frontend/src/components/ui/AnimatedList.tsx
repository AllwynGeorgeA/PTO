import { Children, type ReactNode } from 'react'
import { useMotionOk } from '../../hooks/useMotion'
import { MotionBox } from '../../lib/motion'

const container = { visible: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

export function AnimatedList({ children }: { children: ReactNode }) {
  const ok = useMotionOk()
  return (
    <MotionBox initial={ok ? 'hidden' : false} animate="visible" variants={container}>
      {Children.toArray(children).map((child, i) => (
        <MotionBox key={i} variants={item} mb="3">
          {child}
        </MotionBox>
      ))}
    </MotionBox>
  )
}
