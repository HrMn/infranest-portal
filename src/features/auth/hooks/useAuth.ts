import { useGoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '@/shared/store/authStore'
import { fetchUserRole } from '../services/authService'

export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout } = useAuthStore()

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      try {
        // useGoogleLogin with flow='implicit' gives access_token, not id_token.
        // We use it to fetch userinfo and then pass credential to GAS.
        // For GAS ID token verification, we need the credential flow instead.
        // This hook is used with GoogleLogin component directly (see LoginPage).
        console.warn('useGoogleLogin implicit flow — use GoogleLogin component for id_token', tokenResponse)
      } catch (err) {
        console.error('Login failed', err)
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setLoading(false)
    },
  })

  async function handleCredential(credential: string, profile: { name: string; picture: string }) {
    setLoading(true)
    try {
      const authUser = await fetchUserRole(credential, profile.name, profile.picture)
      setUser(authUser)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  return { user, isLoading, login, logout, handleCredential }
}
