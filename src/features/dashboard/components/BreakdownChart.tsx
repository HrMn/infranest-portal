import { Card, Skeleton, Empty } from 'antd'
import { Pie } from '@ant-design/charts'
import { CategoryBreakdown } from '@/shared/types'
import { CATEGORY_COLORS } from '@/shared/utils/constants'
import { formatCurrency } from '@/shared/utils/formatters'

interface Props {
  title: string
  data: CategoryBreakdown[] | undefined
  loading: boolean
}

export function BreakdownChart({ title, data, loading }: Props) {
  if (loading) {
    return <Card title={title}><Skeleton active paragraph={{ rows: 5 }} /></Card>
  }

  if (!data || data.length === 0) {
    return <Card title={title}><Empty description="No data" /></Card>
  }

  const config = {
    data: data.map((d) => ({ category: d.category, value: d.amount })),
    angleField: 'value',
    colorField: 'category',
    color: data.map((d) => CATEGORY_COLORS[d.category] ?? '#8c8c8c'),
    legend: { position: 'bottom' as const, layout: 'horizontal' as const },
    label: {
      type: 'spider',
      content: ({ percentage }: { percentage: number }) => `${(percentage * 100).toFixed(1)}%`,
      style: { fontSize: 11 },
    },
    tooltip: {
      formatter: (datum: { category: string; value: number }) => ({
        name: datum.category,
        value: formatCurrency(datum.value),
      }),
    },
    innerRadius: 0.5,
  }

  return (
    <Card title={title} style={{ height: '100%' }}>
      <Pie {...config} height={260} />
    </Card>
  )
}
