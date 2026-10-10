import { MotionButton, type MotionButtonProps } from '../../lib/motion'

export function GradientButton({ children, ...props }: MotionButtonProps) {
  return (
    <MotionButton
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      borderRadius="full"
      px="6"
      fontWeight="semibold"
      color="white"
      bgGradient="to-r"
      gradientFrom="ocean.400"
      gradientTo="sunset.400"
      _hover={{ shadow: 'lg' }}
      {...props}
    >
      {children}
    </MotionButton>
  )
}
