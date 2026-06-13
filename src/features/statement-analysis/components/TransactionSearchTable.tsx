import { useState, useMemo } from 'react'
import {
  Card, Table, Input, Select, Space, Tag, Tooltip,
  Typography, Radio, Button,
} from 'antd'
import { SearchOutlined, ClearOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { AnalysisRow } from '../types'
import { formatAmountFull, formatDateDisplay, MONTH_NAMES } from '../utils/analyticsHelpers'

const { Text } = Typography

interface Props {
  rows: AnalysisRow[]
}

export function TransactionSearchTable({ rows }: Props) {
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState<'all' | 'income' | 'expense'>('all')
  const [catFilter,   setCatFilter]   = useState<string | null>(null)
  const [monthFilter, setMonthFilter] = useState<number | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category))).sort(),
    [rows],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      if (q && !r.vendorName.toLowerCase().includes(q) && !r.rawDescription.toLowerCase().includes(q))
        return false
      if (typeFilter === 'income'  && !r.income)      return false
      if (typeFilter === 'expense' && !r.expenditure) return false
      if (catFilter && r.category !== catFilter)       return false
      if (monthFilter !== null) {
        const mm = parseInt(r.date.split('/')[1])
        if (mm !== monthFilter) return false
      }
      return true
    })
  }, [rows, search, typeFilter, catFilter, monthFilter])

  function clearFilters() {
    setSearch('')
    setTypeFilter('all')
    setCatFilter(null)
    setMonthFilter(null)
  }

  const hasFilters = search || typeFilter !== 'all' || catFilter || monthFilter !== null

  const columns: ColumnsType<AnalysisRow> = [
    {
      title:    'Date',
      dataIndex: 'date',
      width:    120,
      sorter:   (a, b) => {
        const da = a.date.split('/').reverse().join('')
        const db = b.date.split('/').reverse().join('')
        return da.localeCompare(db)
      },
      defaultSortOrder: 'descend',
      render: (d: string) => <span style={{ fontSize: 12 }}>{formatDateDisplay(d)}</span>,
    },
    {
      title: 'Party / Description',
      render: (_: unknown, r: AnalysisRow) => (
        <div>
          <Text style={{ fontSize: 13 }}>{r.vendorName}</Text>
          {r.vendorName !== r.rawDescription && (
            <Tooltip title={r.rawDescription}>
              <Text
                type="secondary"
                style={{ display: 'block', fontSize: 11, cursor: 'default' }}
                ellipsis
              >
                {r.rawDescription}
              </Text>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title:    'Category',
      dataIndex: 'category',
      width:    140,
      render:   (c: string) => <Tag style={{ fontSize: 11 }}>{c}</Tag>,
    },
    {
      title: 'Income',
      dataIndex: 'income',
      align: 'right' as const,
      width: 120,
      sorter: (a, b) => (a.income ?? 0) - (b.income ?? 0),
      render: (v: number | null) =>
        v ? (
          <Text strong style={{ color: '#52c41a', fontSize: 12 }}>
            {formatAmountFull(v)}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Expense',
      dataIndex: 'expenditure',
      align: 'right' as const,
      width: 120,
      sorter: (a, b) => (a.expenditure ?? 0) - (b.expenditure ?? 0),
      render: (v: number | null) =>
        v ? (
          <Text strong style={{ color: '#ff4d4f', fontSize: 12 }}>
            {formatAmountFull(v)}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      align: 'right' as const,
      width: 120,
      render: (v: number | null) =>
        v != null ? (
          <Text style={{ fontSize: 12 }}>{formatAmountFull(v)}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ]

  return (
    <Card
      size="small"
      title={
        <Space>
          <Text strong>All Transactions</Text>
          <Tag>{filtered.length.toLocaleString()} rows</Tag>
        </Space>
      }
      extra={
        hasFilters && (
          <Button size="small" icon={<ClearOutlined />} type="link" danger onClick={clearFilters}>
            Clear
          </Button>
        )
      }
    >
      {/* Search + filter toolbar */}
      <Space wrap style={{ marginBottom: 10 }} size={[8, 6]}>
        <Input
          size="small"
          prefix={<SearchOutlined />}
          placeholder="Search party or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 220 }}
        />

        <Radio.Group
          size="small"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          optionType="button"
        >
          <Radio.Button value="all">All</Radio.Button>
          <Radio.Button value="income">Income</Radio.Button>
          <Radio.Button value="expense">Expense</Radio.Button>
        </Radio.Group>

        <Select
          size="small"
          placeholder="Category"
          allowClear
          value={catFilter}
          onChange={(v) => setCatFilter(v ?? null)}
          options={categories.map((c) => ({ label: c, value: c }))}
          style={{ width: 160 }}
        />

        <Select
          size="small"
          placeholder="Month"
          allowClear
          value={monthFilter}
          onChange={(v) => setMonthFilter(v ?? null)}
          options={MONTH_NAMES.map((name, i) => ({ label: name, value: i + 1 }))}
          style={{ width: 100 }}
        />
      </Space>

      <Table
        size="small"
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize:        20,
          showSizeChanger: false,
          showTotal:       (t) => `${t.toLocaleString()} transactions`,
        }}
        scroll={{ x: 800 }}
      />
    </Card>
  )
}
