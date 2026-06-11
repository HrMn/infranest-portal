import { useState, useMemo } from 'react'
import { Table, Tag, Select, Space, Input, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined } from '@ant-design/icons'
import { MMCApartment, MMCStatus } from '@/shared/types'
import { formatCurrency } from '@/shared/utils/formatters'

interface Props {
  mmcStatus: MMCStatus | undefined
  loading: boolean
}

type StatusFilter = 'all' | 'paid' | 'pending'

export function MMCTable({ mmcStatus, loading }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  const months = mmcStatus?.months ?? []
  const currentMonth = mmcStatus?.summary?.currentMonth ?? months[months.length - 1] ?? ''

  const activeMonth = selectedMonth || currentMonth

  const filtered = useMemo(() => {
    let rows = mmcStatus?.apartments ?? []

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter((a) => a.apartment.toLowerCase().includes(q))
    }

    if (statusFilter !== 'all') {
      rows = rows.filter((a) => {
        const paid = a.collections[activeMonth] !== null
        return statusFilter === 'paid' ? paid : !paid
      })
    }

    return rows
  }, [mmcStatus, search, statusFilter, activeMonth])

  const monthColumns: ColumnsType<MMCApartment> = months.map((m) => ({
    title: m,
    dataIndex: m,
    key: m,
    width: 110,
    align: 'right' as const,
    render: (_: unknown, record: MMCApartment) => {
      const val = record.collections[m]
      if (val !== null && val !== undefined) {
        return <Tag color="success" style={{ margin: 0 }}>{formatCurrency(val)}</Tag>
      }
      return record.occupied ? (
        <Tag color="error" style={{ margin: 0 }}>Pending</Tag>
      ) : (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>—</Typography.Text>
      )
    },
  }))

  const fixedColumns: ColumnsType<MMCApartment> = [
    {
      title: 'Apt',
      dataIndex: 'apartment',
      key: 'apartment',
      width: 70,
      fixed: 'left',
      sorter: (a, b) => a.apartment.localeCompare(b.apartment),
    },
    {
      title: 'Owner Type',
      dataIndex: 'ownerType',
      key: 'ownerType',
      width: 100,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: 'Occupied',
      dataIndex: 'occupied',
      key: 'occupied',
      width: 80,
      render: (v: boolean) => v ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>,
    },
  ]

  return (
    <div>
      {/* Filters */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search apartment..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 200 }}
        />
        <Select
          value={activeMonth || undefined}
          placeholder="Select month"
          onChange={setSelectedMonth}
          style={{ width: 140 }}
          options={months.map((m) => ({ label: m, value: m }))}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 130 }}
          options={[
            { label: 'All Status', value: 'all' },
            { label: 'Paid', value: 'paid' },
            { label: 'Pending', value: 'pending' },
          ]}
        />
      </Space>

      <Table<MMCApartment>
        dataSource={filtered}
        columns={[...fixedColumns, ...monthColumns]}
        rowKey="apartment"
        loading={loading}
        size="small"
        scroll={{ x: 800 }}
        pagination={{ pageSize: 30, showSizeChanger: false, showTotal: (t) => `${t} apartments` }}
        bordered
      />
    </div>
  )
}
