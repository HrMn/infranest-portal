import { Menu, LogOut, User } from 'lucide-react'
import { useAuthStore } from '@/shared/store/authStore'
import { useAppStore } from '@/shared/store/appStore'
import { DISPLAY_ROLE_LABELS } from '@/shared/utils/constants'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const user                 = useAuthStore((s) => s.user)
  const logout               = useAuthStore((s) => s.logout)
  const { sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore()

  function handleMenuClick() {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(!mobileSidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMenuClick}
        className="h-8 w-8"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 rounded-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-primary shrink-0">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="h-8 w-8 object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-primary">{user ? DISPLAY_ROLE_LABELS[user.displayRole] ?? user.displayRole : ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
