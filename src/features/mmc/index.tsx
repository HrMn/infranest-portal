import { Alert } from 'antd'
import { PageHeader } from '@/shared/components/PageHeader/PageHeader'
import { MMCSummaryBar } from './components/MMCSummaryBar'
import { MMCTable } from './components/MMCTable'
import { useMMCStatus } from './hooks/useMMCStatus'
import { useAppStore } from '@/shared/store/appStore'

export function MMCPage() {
  const fy = useAppStore((s) => s.selectedFY)
  const { data, isLoading, error } = useMMCStatus()

  return (
    <div>
      <PageHeader
        title="MMC Collection Status"
        subtitle={`Fiscal Year ${fy} — Monthly Maintenance Charges`}
      />

      {error && (
        <Alert
          type="error"
          message="Failed to load MMC data"
          description={(error as Error).message}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <MMCSummaryBar summary={data?.summary} loading={isLoading} />
      <MMCTable mmcStatus={data} loading={isLoading} />
    </div>
  )
}
