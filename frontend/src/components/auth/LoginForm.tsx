import { Field, Input, Stack, Text } from '@chakra-ui/react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { GradientButton } from '../ui/GradientButton'
import { apiErrorMessage, emailError } from './validation'

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
    setLoading(true)
    try {
      await login(email.trim(), password)
      onSuccess?.()
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not log in. Please try again.'))
    } finally {
      setLoading(false)
    }
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
      </Stack>
    </form>
  )
}
