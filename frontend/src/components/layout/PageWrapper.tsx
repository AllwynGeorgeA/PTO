import { MotionBox, type MotionBoxProps } from '../../lib/motion'

export function PageWrapper({ children, ...props }: MotionBoxProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </MotionBox>
  )
}
