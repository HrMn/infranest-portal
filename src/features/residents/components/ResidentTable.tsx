import { useState, useMemo } from 'react'
import { Table, Tag, Input, Select, Space, Badge } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined } from '@ant-design/icons'
import { Resident } from '@/shared/types'

interface Props {
  residents: Resident[] | undefined
  loading: boolean
}

export function ResidentTable({ residents, loading }: Props) {
  const [search, setSearch] = useState('')
  const [occupiedFilter, setOccupiedFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categories = useMemo(() => {
    const set = new Set((residents ?? []).map((r) => r.category).filter(Boolean))
    return Array.from(set)
  }, [residents])

  const filtered = useMemo(() => {
    let rows = residents ?? []

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter((r) =>
        r.apartment.toLowerCase().includes(q) ||
        r.occupantDetails.toLowerCase().includes(q)
      )
    }

    if (occupiedFilter !== 'all') {
      rows = rows.filter((r) => r.occupied === (occupiedFilter === 'yes'))
    }

    if (categoryFilter !== 'all') {
      rows = rows.filter((r) => r.category === categoryFilter)
    }

    return rows
  }, [residents, search, occupiedFilter, categoryFilter])

  const columns: ColumnsType<Resident> = [
    {
      title: 'Apartment',
      dataIndex: 'apartment',
      key: 'apartment',
      sorter: (a, b) => a.apartment.localeCompare(b.apartment),
      width: 90,
    },
    {
      title: 'Owner Type',
      dataIndex: 'ownerType',
      key: 'ownerType',
      width: 110,
    },
    {
      title: 'Status',
      dataIndex: 'occupied',
      key: 'occupied',
      width: 90,
      render: (v: boolean) =>
        v ? <Badge status="success" text="Occupied" /> : <Badge status="default" text="Vacant" />,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (v: string) => v ? <Tag>{v}</Tag> : null,
    },
    {
      title: 'Sub-Category',
      dataIndex: 'subcategory',
      key: 'subcategory',
      width: 130,
    },
    {
      title: 'Occupant Details',
      dataIndex: 'occupantDetails',
      key: 'occupantDetails',
      ellipsis: true,
    },
    {
      title: 'Adults',
      dataIndex: 'adults',
      key: 'adults',
      width: 70,
      align: 'center' as const,
    },
    {
      title: 'Kids',
      dataIndex: 'kids',
      key: 'kids',
      width: 70,
      align: 'center' as const,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 70,
      align: 'center' as const,
      render: (v: number) => <strong>{v}</strong>,
    },
  ]

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search apartment or occupant..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 240 }}
        />
        <Select
          value={occupiedFilter}
          onChange={setOccupiedFilter}
          style={{ width: 130 }}
          options={[
            { label: 'All Status', value: 'all' },
            { label: 'Occupied', value: 'yes' },
            { label: 'Vacant', value: 'no' },
          ]}
        />
        <Select
          value={categoryFilter}
          onChange={setCategoryFilter}
          style={{ width: 160 }}
          options={[
            { label: 'All Categories', value: 'all' },
            ...categories.map((c) => ({ label: c, value: c })),
          ]}
        />
      </Space>

      <Table<Resident>
        dataSource={filtered}
        columns={columns}
        rowKey="apartment"
        loading={loading}
        size="small"
        scroll={{ x: 800 }}
        pagination={{
          pageSize: 20,
          showTotal: (t, r) => `${r[0]}–${r[1]} of ${t} residents`,
        }}
        bordered
      />
    </div>
  )
}
