import { Center, Link, Spinner, Stack, Text } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallbackPage() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [tokens] = useState(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    return access_token && refresh_token ? { access_token, refresh_token } : null
  })
  const [failed, setFailed] = useState(tokens === null)
  const started = useRef(false)

  useEffect(() => {
    if (!tokens || started.current) return // StrictMode double-run guard
    started.current = true
    const { access_token, refresh_token } = tokens
    // Drop tokens from the address bar and history.
    window.history.replaceState(null, '', window.location.pathname)
    setSession({ access_token, refresh_token, token_type: 'bearer' })
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => setFailed(true))
  }, [tokens, setSession, navigate])

  return (
    <Center minH="50vh">
      {failed ? (
        <Stack align="center" gap="2" role="alert">
          <Text>Google sign-in did not work out. Even Google needed a day off. 😬</Text>
          <Link asChild color="brand.fg">
            <RouterLink to="/login">Back to login</RouterLink>
          </Link>
        </Stack>
      ) : (
        <Spinner size="xl" color="brand.solid" />
      )}
    </Center>
  )
}
