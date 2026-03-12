import { Button, Space, Divider, Typography } from 'antd'
import { GithubOutlined, GoogleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { Title } = Typography

export function LoginButtons() {
  const { t } = useTranslation()

  return (
    <div style={{ textAlign: 'center', padding: 24, maxWidth: 360, margin: '0 auto' }}>
      <Title level={3}>Sign in to Inventory App</Title>
      <Divider />
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Button
          icon={<GoogleOutlined />}
          size="large"
          onClick={() => (window.location.href = `${import.meta.env.VITE_API_URL || ''}/auth/google`)}
          style={{ width: '100%', background: '#4285f4', color: '#fff', border: 'none' }}
        >
          {t('auth.sign_in_with_google')}
        </Button>

        <Button
          icon={<GithubOutlined />}
          size="large"
          onClick={() => (window.location.href = `${import.meta.env.VITE_API_URL || ''}/auth/github`)}
          style={{ width: '100%', background: '#24292e', color: '#fff', border: 'none' }}
        >
          {t('auth.sign_in_with_github')}
        </Button>
      </Space>
    </div>
  )
}
