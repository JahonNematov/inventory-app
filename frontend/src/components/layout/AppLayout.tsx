import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'

const { Header, Content } = Layout

export function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 24px' }}>
        <AppHeader />
      </Header>
      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
