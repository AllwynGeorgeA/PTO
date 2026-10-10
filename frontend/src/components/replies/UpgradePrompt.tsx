import { Button, Stack, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'

// What Pro unlocks: sample replies you could keep generating.
const EXAMPLES: { label: string; text: string }[] = [
  { label: '😂 Funny', text: 'My laptop and I are currently seeing other people. Please contact my backup human.' },
  { label: '🌴 Tanglish to manager', text: 'Sir, naan leave-la irukken. Urgent-na en backup-kitta sollunga 🙏' },
  { label: '🕊️ Diplomatic', text: 'Thanks for flagging this. Let us circle back on my return; my backup can help meanwhile.' },
]

export function UpgradePrompt({ message }: { message?: string }) {
  return (
    <Card role="alert" borderColor="sunset.400">
      <Text fontWeight="bold" mb="1">
        🚧 You have hit your free reply limit
      </Text>
      <Text color="fg.muted" mb="3">
        {message ?? 'Your free AI replies are used up this month. Upgrade to keep your out-of-office game strong.'}
      </Text>
      <Text fontSize="sm" fontWeight="semibold" mb="2">
        With Pro ($4.99/month) you keep getting replies like these:
      </Text>
      <Stack gap="2" mb="4" as="ul" listStyleType="none" m="0" p="0">
        {EXAMPLES.map((e) => (
          <li key={e.label}>
            <Text fontSize="sm">
              <b>{e.label}:</b> “{e.text}”
            </Text>
          </li>
        ))}
      </Stack>
      <Button asChild rounded="full" colorPalette="accent">
        <Link to="/pricing">Upgrade to Pro</Link>
      </Button>
    </Card>
  )
}
