import { Badge, Button, Field, Flex, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { apiErrorMessage, passwordError } from '../components/auth/validation'
import { toastOk } from '../lib/toast'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/ui/Card'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import type { User } from '../types'

type Status = { kind: 'ok' | 'error'; text: string } | null

function StatusText({ status }: { status: Status }) {
  if (!status) return null
  return (
    <Text role={status.kind === 'error' ? 'alert' : 'status'} color={status.kind === 'error' ? 'accent.fg' : 'brand.fg'} fontSize="sm">
      {status.text}
    </Text>
  )
}

function ProfileCard({ user }: { user: User }) {
  const { updateUser } = useAuth()
  const [name, setName] = useState(user.full_name ?? '')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [fieldError, setFieldError] = useState<{ name?: string; next?: string; current?: string }>({})
  const [status, setStatus] = useState<Status>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus(null)
    const changingPassword = next !== '' || current !== ''
    const errs = {
      name: name.trim() ? undefined : 'Name cannot be empty',
      next: changingPassword ? (passwordError(next) ?? undefined) : undefined,
      current: changingPassword && !current ? 'Enter your current password' : undefined,
    }
    setFieldError(errs)
    if (errs.name || errs.next || errs.current) return
    setSaving(true)
    try {
      const body: { full_name: string; current_password?: string; new_password?: string } = { full_name: name.trim() }
      if (changingPassword) {
        body.current_password = current
        body.new_password = next
      }
      const { data } = await api.put<User>('/auth/me', body)
      updateUser(data)
      setCurrent('')
      setNext('')
      setStatus({ kind: 'ok', text: 'Saved. Looking sharp. ✨' })
      toastOk('Saved. Looking sharp. ✨')
    } catch (err) {
      setStatus({ kind: 'error', text: apiErrorMessage(err, 'Could not save changes. Please try again.') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <Heading size="lg" mb="4">
        👤 Profile
      </Heading>
      <form onSubmit={submit} noValidate aria-label="Profile">
        <Stack gap="4">
          <Field.Root>
            <Field.Label>Email</Field.Label>
            <Input value={user.email} readOnly disabled />
          </Field.Root>
          <Field.Root invalid={!!fieldError.name}>
            <Field.Label>Full name</Field.Label>
            <Input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            <Field.ErrorText>{fieldError.name}</Field.ErrorText>
          </Field.Root>
          <Text fontWeight="semibold">Change password (optional)</Text>
          <Field.Root invalid={!!fieldError.current}>
            <Field.Label>Current password</Field.Label>
            <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <Field.ErrorText>{fieldError.current}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={!!fieldError.next}>
            <Field.Label>New password</Field.Label>
            <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            <Field.ErrorText>{fieldError.next}</Field.ErrorText>
          </Field.Root>
          <StatusText status={status} />
          <PrimaryButton type="submit" loading={saving} alignSelf="flex-start">
            Save changes
          </PrimaryButton>
        </Stack>
      </form>
    </Card>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <PageWrapper>
      <Stack gap="6" maxW="2xl">
        <Heading size="2xl">⚙️ Tweak your setup</Heading>
        <ProfileCard user={user} />
        <Card>
          <Flex align="center" justify="space-between" wrap="wrap" gap="3">
            <Heading size="lg">🎨 Appearance</Heading>
            <ThemeToggle />
          </Flex>
        </Card>
        <Card>
          <Flex align="center" justify="space-between" wrap="wrap" gap="3">
            <Stack gap="1">
              <Heading size="lg">💳 Plan</Heading>
              <Badge size="lg" alignSelf="flex-start" textTransform="capitalize">
                {user.plan}
              </Badge>
            </Stack>
            <Button asChild variant="outline" rounded="full">
              <RouterLink to="/pricing">Compare plans</RouterLink>
            </Button>
          </Flex>
        </Card>
        <Card>
          <Flex align="center" justify="space-between" wrap="wrap" gap="3">
            <Heading size="lg">🚪 Session</Heading>
            <Button
              variant="outline"
              rounded="full"
              colorPalette="accent"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              Log out 👋
            </Button>
          </Flex>
        </Card>
      </Stack>
    </PageWrapper>
  )
}
