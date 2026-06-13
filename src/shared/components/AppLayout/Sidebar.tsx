import { useLocation, useNavigate } from 'react-router-dom'
import { ReceiptText, BarChart2, Settings2 } from 'lucide-react'
import { useAuthStore } from '@/shared/store/authStore'
import { useAppStore } from '@/shared/store/appStore'
import { hasPermission } from '@/shared/utils/constants'
import { cn } from '@/lib/utils'
import logoUrl from '@/assets/logo.png'

type NavItem = {
  key: string
  icon: React.ReactNode
  label: string
  permission?: string
}

const NAV_ITEMS: NavItem[] = [
  { key: '/transactions',       icon: <ReceiptText className="h-4 w-4" />, label: 'Transactions',       permission: 'view:transactions' },
  { key: '/statement-analysis', icon: <BarChart2   className="h-4 w-4" />, label: 'Statement Analysis', permission: 'view:transactions' },
  { key: '/config',             icon: <Settings2   className="h-4 w-4" />, label: 'Configuration',      permission: 'manage:config' },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const user = useAuthStore((s) => s.user)

  const visibleItems = NAV_ITEMS.filter((item) =>
    !item.permission || (user && hasPermission(user.role, item.permission as never)),
  )

  function isActive(key: string) {
    return location.pathname === key || location.pathname.startsWith(key + '/')
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border shadow-[2px_0_8px_0_rgba(0,0,0,0.06)] bg-sidebar text-sidebar-foreground transition-all duration-200 shrink-0',
        collapsed ? 'w-14' : 'w-52',
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-14 items-center border-b border-sidebar-border px-3', collapsed ? 'justify-center' : 'gap-2.5')}>
        <img
          src={logoUrl}
          alt="Infranest"
          className={cn('object-contain shrink-0', collapsed ? 'h-7 max-w-[36px]' : 'h-8 max-w-[120px]')}
        />
        {!collapsed && (
          <span className="text-sm font-semibold text-sidebar-foreground truncate">Infranest</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {visibleItems.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors',
              isActive(item.key)
                ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              collapsed && 'justify-center px-0',
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  )
}
