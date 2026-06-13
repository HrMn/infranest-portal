import { useState } from 'react'
import { useAppStore } from '@/shared/store/appStore'
import { cn } from '@/lib/utils'
import { Tag, Users } from 'lucide-react'
import { CategoriesPanel } from './components/CategoriesPanel'
import { UserRolesPanel }  from './components/UserRolesPanel'

type Tab = 'categories' | 'users'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'categories', label: 'Categories',  icon: <Tag   className="h-4 w-4" /> },
  { key: 'users',      label: 'User Roles',  icon: <Users className="h-4 w-4" /> },
]

export function ConfigPage() {
  const fy = useAppStore((s) => s.selectedFY)
  const [activeTab, setActiveTab] = useState<Tab>('categories')

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Configuration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage categories and user access</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div>
        {activeTab === 'categories' && <CategoriesPanel fy={fy} />}
        {activeTab === 'users'      && <UserRolesPanel />}
      </div>
    </div>
  )
}
