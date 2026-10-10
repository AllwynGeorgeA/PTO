import { useColorMode } from '../../context/ColorModeContext'
import { MotionIconButton } from '../../lib/motion'

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()
  return (
    <MotionIconButton
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label="Toggle light/dark mode"
      variant="ghost"
      rounded="full"
      onClick={toggleColorMode}
    >
      {colorMode === 'dark' ? '☀️' : '🌙'}
    </MotionIconButton>
  )
}
