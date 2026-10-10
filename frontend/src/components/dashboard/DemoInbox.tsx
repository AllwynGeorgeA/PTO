import { Badge, Button, Flex, Heading, Stack, Text, Textarea } from '@chakra-ui/react'
import { useState } from 'react'
import { errorMessage, generateReply, isLimitReached } from '../../services/replies'
import type { ReplyTone } from '../../types'
import { CopyButton } from '../ui/CopyButton'
import { ErrorNote } from '../ui/ErrorNote'
import { Card } from '../ui/Card'
import { UpgradePrompt } from '../replies/UpgradePrompt'

interface DemoEmail {
  id: number
  from: string
  address: string
  role: string
  subject: string
  body: string
  tone: ReplyTone
  isManager?: boolean
}

// Dummy data for demos only.
const EMAILS: DemoEmail[] = [
  {
    id: 1,
    from: 'Ravi Kumar',
    address: 'ravi.kumar@acme-demo.com',
    role: 'Manager',
    subject: 'Quick sync tomorrow?',
    body: 'Hi, need you on a quick 15 min call tomorrow about the Q4 release. Please confirm.',
    tone: 'tanglish_manager',
    isManager: true,
  },
  {
    id: 2,
    from: 'Ravi Kumar',
    address: 'ravi.kumar@acme-demo.com',
    role: 'Manager',
    subject: 'Status update needed',
    body: 'Can you send me a status update on the client dashboard today? Boss is asking.',
    tone: 'tanglish_manager',
    isManager: true,
  },
  {
    id: 3,
    from: 'Priya (Client)',
    address: 'priya@client-demo.com',
    role: 'Client',
    subject: 'Urgent: dashboard bug',
    body: 'The dashboard is showing wrong numbers again. Can you look at it right now?',
    tone: 'professional',
  },
  {
    id: 4,
    from: 'Arun (Teammate)',
    address: 'arun@acme-demo.com',
    role: 'Teammate',
    subject: 'Review my PR?',
    body: 'Small PR, only 40 files. Can you review it before EOD?',
    tone: 'funny',
  },
]

function EmailRow({ email }: { email: DemoEmail }) {
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(false)

  const generate = async () => {
    setLoading(true)
    setError(null)
    setLimit(false)
    try {
      const r = await generateReply(`Subject: ${email.subject}\n${email.body}`, email.tone, true)
      setReply(r.generated_reply)
    } catch (e) {
      if (isLimitReached(e)) setLimit(true)
      else setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const mailto = `mailto:${email.address}?subject=${encodeURIComponent(`Re: ${email.subject}`)}&body=${encodeURIComponent(reply)}`

  return (
    <Card>
      <Flex justify="space-between" align="start" gap="3" wrap="wrap">
        <Stack gap="1" flex="1" minW="220px">
          <Flex gap="2" align="center" wrap="wrap">
            <Text fontWeight="semibold">{email.from}</Text>
            <Badge colorPalette={email.isManager ? 'accent' : 'gray'}>{email.role}</Badge>
          </Flex>
          <Text fontWeight="medium">{email.subject}</Text>
          <Text color="fg.muted" fontSize="sm">
            {email.body}
          </Text>
        </Stack>
        <Button size="sm" rounded="full" minH="11" onClick={generate} loading={loading}>
          ↩️ {reply ? 'Another take' : 'Reply for me'}
        </Button>
      </Flex>
      {limit && <UpgradePrompt />}
      {error && (
        <Stack mt="3">
          <ErrorNote message={error} />
        </Stack>
      )}
      {reply && (
        <Stack gap="3" mt="4">
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} aria-label="Reply text" />
          <Flex gap="2" wrap="wrap">
            <CopyButton text={reply} />
            <Button asChild size="sm" rounded="full" minH="11">
              <a href={mailto}>✉️ Open in email app</a>
            </Button>
          </Flex>
        </Stack>
      )}
    </Card>
  )
}

export function DemoInbox() {
  return (
    <section aria-label="Demo inbox">
      <Heading size="lg" mb="1">
        📬 Fake inbox (real excuses)
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb="4">
        Sample emails (demo data). Hit Reply for me: the reply also tells them who to contact next and when you are back.
      </Text>
      <Stack gap="3">
        {EMAILS.map((e) => (
          <EmailRow key={e.id} email={e} />
        ))}
      </Stack>
    </section>
  )
}
