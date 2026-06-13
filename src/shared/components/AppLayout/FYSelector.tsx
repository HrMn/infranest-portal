import { useAppStore } from '@/shared/store/appStore'
import { FISCAL_YEARS, FiscalYear } from '@/shared/utils/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function FYSelector() {
  const { selectedFY, setSelectedFY } = useAppStore()

  return (
    <Select value={selectedFY} onValueChange={(v) => setSelectedFY(v as FiscalYear)}>
      <SelectTrigger className="h-8 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FISCAL_YEARS.map((fy) => (
          <SelectItem key={fy} value={fy} className="text-xs">
            {fy}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
