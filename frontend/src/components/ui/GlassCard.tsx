import { MotionBox, type MotionBoxProps } from '../../lib/motion'

export function GlassCard({ children, ...props }: MotionBoxProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      p="6"
      borderRadius="card"
      bg="surface"
      backdropFilter="blur(12px)"
      borderWidth="1px"
      borderColor="border"
      shadow="lg"
      {...props}
    >
      {children}
    </MotionBox>
  )
}
