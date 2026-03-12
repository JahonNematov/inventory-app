import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../../hooks/useAuth'

interface Props {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth()

  if (isLoading) return <Spin fullscreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
