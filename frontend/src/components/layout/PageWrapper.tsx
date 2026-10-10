import { useMotionOk } from '../../hooks/useMotion'
import { MotionBox, type MotionBoxProps } from '../../lib/motion'

// Page transition: slide up and fade in on every route change (pages mount fresh).
export function PageWrapper({ children, ...props }: MotionBoxProps) {
  const ok = useMotionOk()
  return (
    <MotionBox
      initial={ok ? { opacity: 0, y: 14 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      {...props}
    >
      {children}
    </MotionBox>
  )
}
