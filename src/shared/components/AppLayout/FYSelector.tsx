import { Select } from 'antd'
import { useAppStore } from '@/shared/store/appStore'
import { FISCAL_YEARS, FiscalYear } from '@/shared/utils/constants'

export function FYSelector() {
  const { selectedFY, setSelectedFY } = useAppStore()

  return (
    <Select
      value={selectedFY}
      onChange={(v) => setSelectedFY(v as FiscalYear)}
      style={{ width: 120 }}
      size="small"
      options={FISCAL_YEARS.map((fy) => ({ label: fy, value: fy }))}
    />
  )
}
