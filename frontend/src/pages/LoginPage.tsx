import { Card } from 'antd'
import { LoginButtons } from '../components/auth/LoginButtons'

export default function LoginPage() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <LoginButtons />
      </Card>
    </div>
  )
}
