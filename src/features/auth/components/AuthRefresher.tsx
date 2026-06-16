import { useGoogleOneTapLogin } from '@react-oauth/google'
import { useAuthStore } from '@/shared/store/authStore'

// Silently refreshes the Google ID token in the background when the user
// is already signed into Google. Fires on every app load; shows no UI.
// This keeps GAS calls working after the 1-hour token expiry.
export function AuthRefresher() {
  const user    = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  useGoogleOneTapLogin({
    onSuccess: (response) => {
      if (response.credential && user) {
        setUser({ ...user, idToken: response.credential })
      }
    },
    auto_select: true,
    cancel_on_tap_outside: false,
    disabled: !user,
  })

  return null
}
