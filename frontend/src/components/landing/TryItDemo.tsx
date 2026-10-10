import { Box, Button, Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useMotionOk } from '../../hooks/useMotion'
import { MotionBox } from '../../lib/motion'
import { Card } from '../ui/Card'

interface Sample {
  message: string
  reply: string
}

// Canned demo: no API call. A fake message types out, then a funny reply fades in.
const SAMPLES: Sample[] = [
  {
    message: 'Hey, quick question while you are on vacation?',
    reply: 'Thanks for reaching out! I am currently on a beach, emotionally and physically unavailable. My backup Alex will help, and I am back on the 14th. 🏝️',
  },
  {
    message: 'Can you join a 5 min call? It is urgent.',
    reply: 'Urgent things are what backups are for. Alex is your hero until the 14th. My laptop and I are seeing other people. 😎',
  },
  {
    message: 'Are you checking Slack on the beach?',
    reply: 'No. The only thing I am refreshing is my drink. Alex has the keys until the 14th. 🍹',
  },
]

export function TryItDemo() {
  const ok = useMotionOk()
  const [index, setIndex] = useState(0)
  const sample = SAMPLES[index]
  const [typed, setTyped] = useState(ok ? 0 : sample.message.length)
  const typedDone = typed >= sample.message.length

  useEffect(() => {
    if (!ok) return
    const len = SAMPLES[index].message.length
    const t = window.setInterval(() => {
      setTyped((n) => {
        if (n + 1 >= len) window.clearInterval(t)
        return Math.min(n + 1, len)
      })
    }, 35)
    return () => window.clearInterval(t)
  }, [ok, index])

  const next = () => {
    setIndex((i) => (i + 1) % SAMPLES.length)
    setTyped(ok ? 0 : SAMPLES[(index + 1) % SAMPLES.length].message.length)
  }

  const visible = ok ? sample.message.slice(0, typed) : sample.message

  return (
    <Card maxW="2xl" w="full" textAlign="left" aria-label="Try it demo">
      <Stack gap="3">
        <Text fontSize="sm" color="fg.muted" fontWeight="semibold">
          Try it. No signup, no API call, no judgement. 🧪
        </Text>
        <Box bg="bg.muted" rounded="xl" p="3" minH="12" aria-live="polite">
          <Text fontSize="sm" color="fg.muted">
            Colleague:
          </Text>
          <Text>
            {visible}
            {ok && !typedDone && <span aria-hidden="true">|</span>}
          </Text>
        </Box>
        {typedDone && (
          <MotionBox
            key={index}
            initial={ok ? { opacity: 0, y: 12, scale: 0.97 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            bg="brand.subtle"
            borderWidth="1px"
            borderColor="brand.border"
            rounded="xl"
            p="3"
          >
            <Text fontSize="sm" color="brand.fg" fontWeight="semibold">
              PTOShield AI says: 🤖
            </Text>
            <Text>{sample.reply}</Text>
          </MotionBox>
        )}
        <Button alignSelf="flex-start" size="sm" variant="outline" rounded="full" minH="11" onClick={next}>
          Another one 🔄
        </Button>
      </Stack>
    </Card>
  )
}
