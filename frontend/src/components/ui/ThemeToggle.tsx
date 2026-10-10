import { useColorMode } from '../../context/ColorModeContext'
import { useMotionOk } from '../../hooks/useMotion'
import { MotionIconButton } from '../../lib/motion'

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()
  const ok = useMotionOk()
  return (
    <MotionIconButton
      whileHover={ok ? { scale: 1.15, rotate: 20 } : undefined}
      whileTap={ok ? { scale: 0.85, rotate: 180 } : undefined}
      aria-label="Toggle light/dark mode"
      variant="ghost"
      rounded="full"
      minW="11"
      h="11"
      onClick={toggleColorMode}
    >
      {colorMode === 'dark' ? '☀️' : '🌙'}
    </MotionIconButton>
  )
}
