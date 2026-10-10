import { Link } from '@chakra-ui/react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return (
    <AuthCard
      title="Welcome back 🏖️"
      subtitle="Log in to check on your out-of-office."
      footer={
        <>
          New here?{' '}
          <Link asChild color="brand.fg">
            <RouterLink to="/register">Create an account</RouterLink>
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  )
}
