import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '@/shared/store/authStore'
import { APP_NAME, ASSOCIATION_NAME } from '@/shared/utils/constants'
import logoUrl from '@/assets/logo.png'

export function LoginPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isLoading, handleCredential } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  async function onSuccess(response: CredentialResponse) {
    if (!response.credential) {
      setError('No credential received from Google. Please try again.')
      return
    }
    setError(null)
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      await handleCredential(response.credential, {
        name: payload.name ?? '',
        picture: payload.picture ?? '',
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center space-y-7">
          {/* Logo */}
          <div className="space-y-3">
            <img
              src={logoUrl}
              alt="Infranest"
              className="h-16 w-auto max-w-full mx-auto object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{APP_NAME}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{ASSOCIATION_NAME}</p>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Sign in with your Google account to continue.
          </p>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={onSuccess}
                onError={() => setError('Google sign-in failed. Please try again.')}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            </div>
          )}

          <p className="text-xs text-gray-400">
            Authorized users only. Contact the Treasurer if you need access.
          </p>
        </div>
      </div>
    </div>
  )
}
