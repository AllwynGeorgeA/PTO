import { MotionBox, type MotionBoxProps } from '../../lib/motion'

// Flat card: surface colour, hairline border, no blur or heavy shadow.
export function Card({ children, ...props }: MotionBoxProps) {
  return (
    <MotionBox p="6" borderRadius="card" bg="surface" borderWidth="1px" borderColor="border" {...props}>
      {children}
    </MotionBox>
  )
}
