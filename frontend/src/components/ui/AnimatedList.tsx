import { Children, type ReactNode } from 'react'
import { MotionBox } from '../../lib/motion'

const container = { visible: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

export function AnimatedList({ children }: { children: ReactNode }) {
  return (
    <MotionBox initial="hidden" animate="visible" variants={container}>
      {Children.toArray(children).map((child, i) => (
        <MotionBox key={i} variants={item} mb="3">
          {child}
        </MotionBox>
      ))}
    </MotionBox>
  )
}
