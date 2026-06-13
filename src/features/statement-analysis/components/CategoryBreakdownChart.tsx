import { useState, useMemo } from 'react'
import { Card, Empty, Radio, Space, Typography, Table, Tag } from 'antd'
import { Pie } from '@ant-design/charts'
import { AnalysisRow } from '../types'
import { getCategoryTotals, formatAmount, formatAmountFull } from '../utils/analyticsHelpers'

const { Text } = Typography

interface Props {
  rows: AnalysisRow[]
}

export function CategoryBreakdownChart({ rows }: Props) {
  const [mode, setMode] = useState<'expense' | 'income'>('expense')

  const data = useMemo(() => getCategoryTotals(rows, mode), [rows, mode])

  const total = data.reduce((s, c) => s + c.amount, 0)

  if (data.length === 0) {
    return (
      <Card
        size="small"
        title="Category Breakdown"
        extra={<ModeToggle mode={mode} onChange={setMode} />}
      >
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data for the selected filters" />
      </Card>
    )
  }

  const pieConfig = {
    data,
    angleField:  'amount',
    colorField:  'category',
    innerRadius: 0.6,
    label: {
      text:  (d: { category: string; amount: number }) =>
        `${((d.amount / total) * 100).toFixed(1)}%`,
      style: { fontSize: 11 },
    },
    tooltip: {
      items: [
        {
          field: 'category',
          name:  'Category',
        },
        {
          field:          'amount',
          name:           'Amount',
          valueFormatter: (v: number) => formatAmountFull(v),
        },
        {
          field:          'count',
          name:           'Transactions',
        },
      ],
    },
    legend: {
      color: { position: 'right' as const, maxRows: 10 },
    },
    statistic: {
      title: {
        content: mode === 'expense' ? 'Expense' : 'Income',
        style: { fontSize: 13 },
      },
      content: {
        content:  formatAmount(total),
        style:   { fontSize: 16, fontWeight: 600 },
      },
    },
  }

  const tableColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      render: (c: string) => <Tag style={{ fontSize: 11 }}>{c}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'right' as const,
      render: (v: number) => (
        <Text strong style={{ color: mode === 'expense' ? '#ff4d4f' : '#52c41a', fontSize: 12 }}>
          {formatAmountFull(v)}
        </Text>
      ),
    },
    {
      title: '%',
      align: 'right' as const,
      render: (_: unknown, r: { amount: number }) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {((r.amount / total) * 100).toFixed(1)}%
        </Text>
      ),
    },
    {
      title: 'Txns',
      dataIndex: 'count',
      align: 'right' as const,
      render: (c: number) => <Text type="secondary" style={{ fontSize: 11 }}>{c}</Text>,
    },
  ]

  return (
    <Card
      size="small"
      title={
        <Space>
          <Text strong>Category Breakdown</Text>
        </Space>
      }
      extra={<ModeToggle mode={mode} onChange={setMode} />}
    >
      <Pie {...pieConfig} height={240} />
      <Table
        size="small"
        dataSource={data}
        columns={tableColumns}
        rowKey="category"
        pagination={false}
        style={{ marginTop: 12 }}
      />
    </Card>
  )
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'expense' | 'income'
  onChange: (m: 'expense' | 'income') => void
}) {
  return (
    <Radio.Group
      size="small"
      value={mode}
      onChange={(e) => onChange(e.target.value)}
      optionType="button"
    >
      <Radio.Button value="expense">Expense</Radio.Button>
      <Radio.Button value="income">Income</Radio.Button>
    </Radio.Group>
  )
}
