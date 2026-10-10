import { Box } from '@chakra-ui/react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMotionOk } from '../../hooks/useMotion'
import { MotionBox } from '../../lib/motion'
import { FunContext, NOOP, type FunApi } from '../../hooks/useFun'

interface Particle {
  id: number
  emoji: string
  x: number
  y: number
  dx: number
  dy: number
  rotate: number
  duration: number
  delay: number
  fall: boolean
}

const BURST_EMOJI = ['🎉', '🏝️', '🥥', '✨', '🦥', '🌴']
const SHOWER_EMOJI = ['🏝️', '🦥', '🌴', '🥥', '🍹', '😎']
const rand = (min: number, max: number): number => min + Math.random() * (max - min)

export function FunProvider({ children }: { children: ReactNode }) {
  const ok = useMotionOk()
  const [particles, setParticles] = useState<Particle[]>([])
  const nextId = useRef(0)

  const add = useCallback((batch: Particle[], ms: number) => {
    setParticles((p) => [...p, ...batch])
    const ids = new Set(batch.map((b) => b.id))
    window.setTimeout(() => setParticles((p) => p.filter((x) => !ids.has(x.id))), ms)
  }, [])

  const api = useMemo<FunApi>(() => {
    if (!ok) return NOOP
    return {
      burst: (at) => {
        const x = at?.x ?? window.innerWidth / 2
        const y = at?.y ?? window.innerHeight / 2
        const batch = Array.from({ length: 14 }, (_, i): Particle => {
          const angle = (i / 14) * Math.PI * 2 + rand(-0.2, 0.2)
          const dist = rand(70, 160)
          return {
            id: nextId.current++,
            emoji: BURST_EMOJI[i % BURST_EMOJI.length],
            x,
            y,
            dx: Math.cos(angle) * dist,
            dy: Math.sin(angle) * dist - 40,
            rotate: rand(-180, 180),
            duration: rand(0.8, 1.2),
            delay: 0,
            fall: false,
          }
        })
        add(batch, 1500)
      },
      shower: () => {
        const batch = Array.from({ length: 28 }, (_, i): Particle => ({
          id: nextId.current++,
          emoji: SHOWER_EMOJI[i % SHOWER_EMOJI.length],
          x: rand(2, 96),
          y: -40,
          dx: rand(-40, 40),
          dy: window.innerHeight + 80,
          rotate: rand(-360, 360),
          duration: rand(2, 3.5),
          delay: rand(0, 1),
          fall: true,
        }))
        add(batch, 5000)
      },
    }
  }, [ok, add])

  return (
    <FunContext.Provider value={api}>
      {children}
      <Box aria-hidden="true" position="fixed" inset="0" pointerEvents="none" overflow="hidden" zIndex="toast">
        {particles.map((p) => (
          <MotionBox
            key={p.id}
            position="absolute"
            left={p.fall ? `${p.x}%` : `${p.x}px`}
            top={`${p.y}px`}
            fontSize="2xl"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{ x: p.dx, y: p.dy, opacity: p.fall ? 1 : 0, scale: 1.2, rotate: p.rotate }}
            transition={{ duration: p.duration, delay: p.delay, ease: p.fall ? 'easeIn' : 'easeOut' }}
          >
            {p.emoji}
          </MotionBox>
        ))}
      </Box>
    </FunContext.Provider>
  )
}
