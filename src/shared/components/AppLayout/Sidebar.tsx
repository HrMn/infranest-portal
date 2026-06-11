import { useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Typography } from 'antd'
import {
  DashboardOutlined,
  BankOutlined,
  TeamOutlined,
  BarChartOutlined,
  TransactionOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/shared/store/authStore'
import { APP_NAME, hasPermission } from '@/shared/utils/constants'
import { useAppStore } from '@/shared/store/appStore'
import { Permission } from '@/shared/types'

const { Sider } = Layout

type MenuItem = {
  key: string
  icon: React.ReactNode
  label: string
  children?: MenuItem[]
  permission?: Permission
}

const NAV_ITEMS: MenuItem[] = [
  { key: '/',          icon: <DashboardOutlined />,   label: 'Dashboard',         permission: 'view:dashboard' },
  { key: '/mmc',       icon: <BankOutlined />,        label: 'MMC Collections',   permission: 'view:mmc' },
  { key: '/residents', icon: <TeamOutlined />,        label: 'Resident Directory', permission: 'view:residents' },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: 'Reports',
    permission: 'view:reports',
    children: [
      { key: '/reports/monthly',  icon: <BarChartOutlined />, label: 'Monthly Summary' },
      { key: '/reports/income',   icon: <BarChartOutlined />, label: 'Income Analysis' },
      { key: '/reports/expense',  icon: <BarChartOutlined />, label: 'Expense Analysis' },
      { key: '/reports/mmc',      icon: <BarChartOutlined />, label: 'MMC Analysis' },
    ],
  },
  { key: '/transactions', icon: <TransactionOutlined />, label: 'Transactions', permission: 'view:transactions' },
  { key: '/settings/users', icon: <SettingOutlined />, label: 'Settings', permission: 'view:settings' },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const user = useAuthStore((s) => s.user)

  // Determine selected and open keys
  const selectedKey = location.pathname
  const openKeys = NAV_ITEMS
    .filter((item) => item.children?.some((c) => location.pathname.startsWith(c.key)))
    .map((item) => item.key)

  function buildMenuItems() {
    if (!user) return []
    return NAV_ITEMS
      .filter((item) => {
        if (!item.permission) return true
        return hasPermission(user.role, item.permission)
      })
      .map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
        children: item.children?.map((c) => ({
          key: c.key,
          icon: c.icon,
          label: c.label,
        })),
      }))
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={220}
      style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 20px',
          gap: 10,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: '#1677ff',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          IN
        </div>
        {!collapsed && (
          <Typography.Text strong style={{ fontSize: 14 }}>
            {APP_NAME}
          </Typography.Text>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={openKeys}
        items={buildMenuItems()}
        onClick={({ key }) => navigate(key)}
        style={{ border: 'none', paddingTop: 8 }}
      />
    </Sider>
  )
}
