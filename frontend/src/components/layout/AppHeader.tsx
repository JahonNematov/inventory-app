import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Input, Button, Avatar, Dropdown, Space, Select } from 'antd'
import { SearchOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { useLogoutMutation } from '../../store/api/authApi'
import { useTranslation } from 'react-i18next'

export function AppHeader() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [logout] = useLogoutMutation()
  const [searchValue, setSearchValue] = useState('')
  const { t, i18n } = useTranslation()

  const handleSearch = () => {
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
    window.location.reload()
  }

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: <Link to="/profile">{t('nav.profile')}</Link>,
        icon: <UserOutlined />,
      },
      ...(isAdmin
        ? [
            {
              key: 'admin',
              label: <Link to="/admin">{t('nav.admin')}</Link>,
              icon: <SettingOutlined />,
            },
          ]
        : []),
      { type: 'divider' as const },
      {
        key: 'logout',
        label: t('nav.logout'),
        icon: <LogoutOutlined />,
        onClick: handleLogout,
      },
    ],
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: '100%' }}>
      <Link to="/" style={{ fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap', color: 'white' }}>
        📦 Inventory
      </Link>

      <Input.Search
        placeholder={t('common.search')}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onSearch={handleSearch}
        style={{ flex: 1, maxWidth: 500 }}
        prefix={<SearchOutlined />}
        enterButton
      />

      <Space style={{ marginLeft: 'auto' }}>
        <Select
          value={i18n.language.startsWith('uz') ? 'uz' : 'en'}
          onChange={(lang) => i18n.changeLanguage(lang)}
          options={[
            { value: 'en', label: '🇬🇧 EN' },
            { value: 'uz', label: '🇺🇿 UZ' },
          ]}
          style={{ width: 90 }}
        />

        {isAuthenticated ? (
          <Dropdown menu={userMenu} placement="bottomRight">
            <Avatar src={user?.avatar} icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
          </Dropdown>
        ) : (
          <Button type="primary" onClick={() => navigate('/login')}>
            {t('common.login')}
          </Button>
        )}
      </Space>
    </div>
  )
}
