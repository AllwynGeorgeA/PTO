import { Button, Field, Input, Stack, Text } from '@chakra-ui/react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { GradientButton } from '../ui/GradientButton'
import { apiErrorMessage, emailError } from './validation'

// Public demo account created by `python -m scripts.seed`. Shown in dev, or when VITE_DEMO_LOGIN=true.
const DEMO_EMAIL = 'demo@ptoshield.ai'
const DEMO_PASSWORD = 'DemoPass123!'
const SHOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_DEMO_LOGIN === 'true'

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      email: emailError(email) ?? undefined,
      password: password ? undefined : 'Password is required',
    }
    setErrors(next)
    setFormError(null)
    if (next.email || next.password) return
    await attempt(email.trim(), password)
  }

  const attempt = async (loginEmail: string, loginPassword: string) => {
    setLoading(true)
    try {
      await login(loginEmail, loginPassword)
      onSuccess?.()
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not log in. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = () => {
    setFormError(null)
    return attempt(DEMO_EMAIL, DEMO_PASSWORD)
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Log in">
      <Stack gap="4">
        <Field.Root invalid={!!errors.email}>
          <Field.Label>Email</Field.Label>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field.ErrorText>{errors.email}</Field.ErrorText>
        </Field.Root>
        <Field.Root invalid={!!errors.password}>
          <Field.Label>Password</Field.Label>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Field.ErrorText>{errors.password}</Field.ErrorText>
        </Field.Root>
        {formError && (
          <Text role="alert" color="red.500" fontSize="sm">
            {formError}
          </Text>
        )}
        <GradientButton type="submit" loading={loading}>
          Log in
        </GradientButton>
        {SHOW_DEMO && (
          <Button type="button" variant="outline" onClick={demoLogin} disabled={loading}>
            🏝️ Try the demo account
          </Button>
        )}
        {SHOW_DEMO && (
          <Text fontSize="sm" color="fg.muted" textAlign="center">
            Demo login: <b>{DEMO_EMAIL}</b> / <b>{DEMO_PASSWORD}</b>
          </Text>
        )}
      </Stack>
    </form>
  )
}
