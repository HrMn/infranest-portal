import { create } from 'zustand'
import { DEFAULT_FY, FiscalYear } from '@/shared/utils/constants'

interface AppState {
  selectedFY: FiscalYear
  sidebarCollapsed: boolean
  setSelectedFY: (fy: FiscalYear) => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedFY: DEFAULT_FY,
  sidebarCollapsed: false,
  setSelectedFY: (selectedFY) => set({ selectedFY }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}))
