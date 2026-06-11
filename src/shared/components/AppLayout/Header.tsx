import { Layout, Space, Avatar, Dropdown, Typography, Button, Tooltip } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/shared/store/authStore'
import { useAppStore } from '@/shared/store/appStore'
import { FYSelector } from './FYSelector'
import { ROLE_LABELS } from '@/shared/utils/constants'

const { Header: AntHeader } = Layout

export function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()

  const userMenuItems = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div><strong>{user?.name}</strong></div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{user?.email}</div>
          <div style={{ color: '#1677ff', fontSize: 12 }}>
            {user ? ROLE_LABELS[user.role] : ''}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: logout,
    },
  ]

  return (
    <AntHeader
      style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left: collapse toggle */}
      <Button
        type="text"
        icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        style={{ fontSize: 16, width: 40, height: 40 }}
      />

      {/* Right: FY selector + user */}
      <Space size={16}>
        <Space size={8}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Fiscal Year:
          </Typography.Text>
          <FYSelector />
        </Space>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <Tooltip title={user?.name}>
            <Avatar
              src={user?.picture}
              icon={<UserOutlined />}
              style={{ cursor: 'pointer', background: '#1677ff' }}
            />
          </Tooltip>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}
