import { Center, Spinner } from '@chakra-ui/react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" color="ocean.500" />
      </Center>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
