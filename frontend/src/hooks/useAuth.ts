import { useGetMeQuery } from '../store/api/authApi'

export function useAuth() {
  const { data: user, isLoading } = useGetMeQuery()

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin ?? false,
  }
}
