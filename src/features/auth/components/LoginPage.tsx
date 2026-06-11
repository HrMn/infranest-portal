import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { Card, Typography, Space, Alert, Spin } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '@/shared/store/authStore'
import { APP_NAME, ASSOCIATION_NAME } from '@/shared/utils/constants'

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
      // Decode the JWT to get name and picture (public claims, no secret needed)
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      await handleCredential(response.credential, {
        name: payload.name ?? '',
        picture: payload.picture ?? '',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}
        styles={{ body: { padding: '48px 40px' } }}
      >
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          {/* Logo / Brand */}
          <Space direction="vertical" size={8}>
            <div
              style={{
                width: 64,
                height: 64,
                background: '#1677ff',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: 28,
                color: '#fff',
                fontWeight: 700,
              }}
            >
              IN
            </div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {APP_NAME}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {ASSOCIATION_NAME}
            </Typography.Text>
          </Space>

          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            Sign in with your Google account to continue.
          </Typography.Text>

          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          {isLoading ? (
            <Spin size="large" />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
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

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Authorized users only. Contact the Treasurer if you need access.
          </Typography.Text>
        </Space>
      </Card>
    </div>
  )
}
