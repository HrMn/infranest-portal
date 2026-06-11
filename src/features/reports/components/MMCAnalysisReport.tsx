import { Table, Card, Skeleton } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Column } from '@ant-design/charts'
import { MMCStatus, MMCApartment } from '@/shared/types'
import { collectionRateColor } from '@/shared/utils/formatters'

interface Props {
  data: MMCStatus | undefined
  loading: boolean
}

export function MMCAnalysisReport({ data, loading }: Props) {
  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />

  const months = data?.months ?? []
  const apartments = data?.apartments ?? []

  // Collection rate per month
  const monthlyRates = months.map((m) => {
    const occupied = apartments.filter((a) => a.occupied)
    const paid = occupied.filter((a) => a.collections[m] !== null).length
    const rate = occupied.length ? Math.round((paid / occupied.length) * 100) : 0
    return { month: m, rate, paid, total: occupied.length }
  })

  const columns: ColumnsType<MMCApartment> = [
    { title: 'Apt', dataIndex: 'apartment', key: 'apartment', width: 70, sorter: (a, b) => a.apartment.localeCompare(b.apartment) },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 130 },
    ...months.map((m) => ({
      title: m,
      key: m,
      width: 90,
      align: 'center' as const,
      render: (_: unknown, record: MMCApartment) => {
        const val = record.collections[m]
        if (val !== null && val !== undefined) return <span style={{ color: '#52c41a' }}>✓</span>
        return record.occupied ? <span style={{ color: '#ff4d4f' }}>✗</span> : <span>—</span>
      },
    })),
  ]

  return (
    <div>
      {/* Collection rate trend */}
      <Card title="Monthly Collection Rate" style={{ marginBottom: 24 }}>
        <Column
          data={monthlyRates.map((r) => ({ month: r.month, rate: r.rate }))}
          xField="month"
          yField="rate"
          color={(d: { month: string; rate: number }) => collectionRateColor(d.rate)}
          axis={{ y: { labelFormatter: (v: number) => `${v}%` } }}
          height={200}
          label={{ formatter: (v: number) => `${v}%` }}
        />
      </Card>

      {/* Per-apartment payment grid */}
      <Table<MMCApartment>
        dataSource={apartments.filter((a) => a.occupied)}
        columns={columns}
        rowKey="apartment"
        size="small"
        scroll={{ x: 700 }}
        pagination={{ pageSize: 30, showTotal: (t) => `${t} occupied apartments` }}
        bordered
      />
    </div>
  )
}
