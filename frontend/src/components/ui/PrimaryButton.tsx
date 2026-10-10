import { useMotionOk } from '../../hooks/useMotion'
import { MotionButton, type MotionButtonProps } from '../../lib/motion'

// The one big button on a page: teal, rounded, bounces on hover and squishes on tap.
export function PrimaryButton({ children, ...props }: MotionButtonProps) {
  const ok = useMotionOk()
  return (
    <MotionButton
      whileHover={ok ? { scale: 1.05, rotate: [0, -2, 2, 0] } : undefined}
      whileTap={ok ? { scale: 0.94 } : undefined}
      colorPalette="brand"
      borderRadius="full"
      px="6"
      minH="11"
      fontWeight="semibold"
      {...props}
    >
      {children}
    </MotionButton>
  )
}
