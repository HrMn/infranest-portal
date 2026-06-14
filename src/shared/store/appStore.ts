import { create } from 'zustand'
import { DEFAULT_FY, FiscalYear } from '@/shared/utils/constants'

interface AppState {
  selectedFY: FiscalYear
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  setSelectedFY: (fy: FiscalYear) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedFY: DEFAULT_FY,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  setSelectedFY: (selectedFY) => set({ selectedFY }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
}))
