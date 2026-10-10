import { Field, Input, Stack, Text } from '@chakra-ui/react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { GradientButton } from '../ui/GradientButton'
import { apiErrorMessage, emailError, passwordError } from './validation'

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      name: name.trim() ? undefined : 'Tell us your name',
      email: emailError(email) ?? undefined,
      password: passwordError(password) ?? undefined,
    }
    setErrors(next)
    setFormError(null)
    if (next.name || next.email || next.password) return
    setLoading(true)
    try {
      await register(email.trim(), password, name.trim())
      onSuccess?.()
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not sign up. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Sign up">
      <Stack gap="4">
        <Field.Root invalid={!!errors.name}>
          <Field.Label>Full name</Field.Label>
          <Input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          <Field.ErrorText>{errors.name}</Field.ErrorText>
        </Field.Root>
        <Field.Root invalid={!!errors.email}>
          <Field.Label>Email</Field.Label>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field.ErrorText>{errors.email}</Field.ErrorText>
        </Field.Root>
        <Field.Root invalid={!!errors.password}>
          <Field.Label>Password</Field.Label>
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Field.HelperText>At least 8 characters</Field.HelperText>
          <Field.ErrorText>{errors.password}</Field.ErrorText>
        </Field.Root>
        {formError && (
          <Text role="alert" color="red.500" fontSize="sm">
            {formError}
          </Text>
        )}
        <GradientButton type="submit" loading={loading}>
          Create account
        </GradientButton>
      </Stack>
    </form>
  )
}
