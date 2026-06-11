import { Alert } from 'antd'
import { PageHeader } from '@/shared/components/PageHeader/PageHeader'
import { ResidentTable } from './components/ResidentTable'
import { useResidents } from './hooks/useResidents'
import { useAppStore } from '@/shared/store/appStore'

export function ResidentDirectoryPage() {
  const fy = useAppStore((s) => s.selectedFY)
  const { data, isLoading, error } = useResidents()

  const occupied = (data ?? []).filter((r) => r.occupied).length
  const total = (data ?? []).length

  return (
    <div>
      <PageHeader
        title="Resident Directory"
        subtitle={`${occupied} occupied · ${total - occupied} vacant · ${total} total — FY ${fy}`}
      />

      {error && (
        <Alert
          type="error"
          message="Failed to load residents"
          description={(error as Error).message}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <ResidentTable residents={data} loading={isLoading} />
    </div>
  )
}
