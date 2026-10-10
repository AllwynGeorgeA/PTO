import { Button } from '@chakra-ui/react'

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export function GoogleLoginButton() {
  return (
    <Button asChild variant="outline" rounded="full" w="full">
      <a href={`${API_URL}/api/v1/auth/google`}>🌐 Continue with Google</a>
    </Button>
  )
}
