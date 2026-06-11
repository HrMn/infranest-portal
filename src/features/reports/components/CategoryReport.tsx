import { Table, Card, Row, Col, Skeleton } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Pie } from '@ant-design/charts'
import { CategoryBreakdown } from '@/shared/types'
import { CATEGORY_COLORS } from '@/shared/utils/constants'
import { formatCurrency, formatPercentage } from '@/shared/utils/formatters'

interface Props {
  data: CategoryBreakdown[] | undefined
  loading: boolean
  title: string
}

export function CategoryReport({ data, loading, title }: Props) {
  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />

  const columns: ColumnsType<CategoryBreakdown> = [
    { title: 'Category', dataIndex: 'category', key: 'category' },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (v: number) => formatCurrency(v),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Share',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'right',
      render: (v: number) => formatPercentage(v),
    },
  ]

  const pieConfig = {
    data: (data ?? []).map((d) => ({ category: d.category, value: d.amount })),
    angleField: 'value',
    colorField: 'category',
    color: (data ?? []).map((d) => CATEGORY_COLORS[d.category] ?? '#8c8c8c'),
    innerRadius: 0.5,
    legend: { position: 'right' as const, layout: 'vertical' as const },
    label: { type: 'spider', content: ({ percentage }: { percentage: number }) => `${(percentage * 100).toFixed(1)}%`, style: { fontSize: 11 } },
    tooltip: {
      formatter: (datum: { category: string; value: number }) => ({
        name: datum.category,
        value: formatCurrency(datum.value),
      }),
    },
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={10}>
        <Card title={title}>
          <Pie {...pieConfig} height={320} />
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Table<CategoryBreakdown>
          dataSource={data}
          columns={columns}
          rowKey="category"
          size="small"
          pagination={false}
          bordered
        />
      </Col>
    </Row>
  )
}
