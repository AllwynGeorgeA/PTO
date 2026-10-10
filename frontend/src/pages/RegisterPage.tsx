import { Link } from '@chakra-ui/react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { RegisterForm } from '../components/auth/RegisterForm'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return (
    <AuthCard
      title="Start your vacation 🌴"
      subtitle="Free forever. Guilt not included."
      footer={
        <>
          Already have an account?{' '}
          <Link asChild color="brand.fg">
            <RouterLink to="/login">Log in</RouterLink>
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  )
}
