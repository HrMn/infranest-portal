import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ReceiptText, Settings2, Wallet, LayoutDashboard, ChevronDown, ChevronRight, FileBarChart2 } from 'lucide-react'
import { useAuthStore } from '@/shared/store/authStore'
import { useAppStore } from '@/shared/store/appStore'
import { hasPermission } from '@/shared/utils/constants'
import { cn } from '@/lib/utils'
import logoUrl from '@/assets/logo.png'
import type { Permission } from '@/shared/types'

type NavLeaf = {
  type: 'leaf'
  key: string
  icon: React.ReactNode
  label: string
  permission?: Permission
}

type NavGroup = {
  type: 'group'
  key: string
  icon: React.ReactNode
  label: string
  permission?: Permission
  children: NavLeaf[]
}

type NavEntry = NavLeaf | NavGroup

const NAV_ENTRIES: NavEntry[] = [
  {
    type: 'group',
    key: 'financials',
    icon: <Wallet className="h-4 w-4" />,
    label: 'Financials',
    permission: 'view:transactions',
    children: [
      { type: 'leaf', key: '/financials/dashboard',    icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard',    permission: 'view:transactions' },
      { type: 'leaf', key: '/financials/transactions', icon: <ReceiptText     className="h-4 w-4" />, label: 'Transactions', permission: 'view:transactions' },
      { type: 'leaf', key: '/financials/reports',      icon: <FileBarChart2   className="h-4 w-4" />, label: 'Reports',      permission: 'view:transactions' },
    ],
  },
  { type: 'leaf', key: '/config', icon: <Settings2 className="h-4 w-4" />, label: 'Configuration', permission: 'manage:config' },
]

export function Sidebar() {
  const location             = useLocation()
  const navigate             = useNavigate()
  const collapsed            = useAppStore((s) => s.sidebarCollapsed)
  const mobileSidebarOpen    = useAppStore((s) => s.mobileSidebarOpen)
  const setMobileSidebarOpen = useAppStore((s) => s.setMobileSidebarOpen)
  const user                 = useAuthStore((s) => s.user)

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(['financials']))

  function canSee(permission?: Permission) {
    if (!permission) return true
    return !!user && hasPermission(user.privilege, permission)
  }

  function isActive(key: string) {
    return location.pathname === key || location.pathname.startsWith(key + '/')
  }

  function toggleGroup(key: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const itemClass = (active: boolean) =>
    cn(
      'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors',
      active
        ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
    )

  function renderLeaf(item: NavLeaf, indent = false) {
    if (!canSee(item.permission)) return null
    const active = isActive(item.key)
    return (
      <button
        key={item.key}
        onClick={() => { navigate(item.key); setMobileSidebarOpen(false) }}
        className={cn(itemClass(active), collapsed && 'justify-center px-0', indent && !collapsed && 'pl-7')}
        title={collapsed ? item.label : undefined}
      >
        {item.icon}
        {!collapsed && <span>{item.label}</span>}
      </button>
    )
  }

  function renderGroup(group: NavGroup) {
    if (!canSee(group.permission)) return null
    const visibleChildren = group.children.filter((c) => canSee(c.permission))
    if (visibleChildren.length === 0) return null

    const groupActive = visibleChildren.some((c) => isActive(c.key))
    const isOpen      = openGroups.has(group.key)

    if (collapsed) {
      // In collapsed mode show only the group icon; click navigates to first child
      return (
        <button
          key={group.key}
          onClick={() => { navigate(visibleChildren[0].key); setMobileSidebarOpen(false) }}
          className={cn(itemClass(groupActive), 'justify-center px-0')}
          title={group.label}
        >
          {group.icon}
        </button>
      )
    }

    return (
      <div key={group.key}>
        <button
          onClick={() => toggleGroup(group.key)}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors',
            groupActive
              ? 'text-sidebar-foreground font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
          )}
        >
          {group.icon}
          <span className="flex-1 text-left">{group.label}</span>
          {isOpen
            ? <ChevronDown  className="h-3.5 w-3.5 opacity-60" />
            : <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
        </button>
        {isOpen && (
          <div className="mt-0.5 space-y-0.5">
            {visibleChildren.map((c) => renderLeaf(c, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border shadow-[2px_0_8px_0_rgba(0,0,0,0.06)] bg-sidebar text-sidebar-foreground transition-all duration-200 shrink-0',
        // Mobile: fixed overlay, slide in/out
        'print:hidden fixed inset-y-0 left-0 z-50 w-64',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: static in flex layout, collapsible
        'md:relative md:inset-auto md:z-auto md:translate-x-0',
        collapsed ? 'md:w-14' : 'md:w-52',
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
        {NAV_ENTRIES.map((entry) =>
          entry.type === 'group' ? renderGroup(entry) : renderLeaf(entry),
        )}
      </nav>
    </aside>
  )
}
