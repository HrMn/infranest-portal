import { Card, Skeleton } from 'antd'
import { Column } from '@ant-design/charts'
import { MonthlyTrendPoint } from '@/shared/types'
import { CHART_COLORS } from '@/shared/utils/constants'

interface Props {
  data: MonthlyTrendPoint[] | undefined
  loading: boolean
}

export function MonthlyTrendChart({ data, loading }: Props) {
  if (loading) {
    return <Card title="Monthly Trend"><Skeleton active paragraph={{ rows: 5 }} /></Card>
  }

  const chartData = (data ?? []).flatMap((d) => [
    { month: d.month, type: 'Income',  value: d.income },
    { month: d.month, type: 'Expense', value: d.expense },
  ])

  const config = {
    data: chartData,
    xField: 'month',
    yField: 'value',
    colorField: 'type',
    group: true,
    color: [CHART_COLORS.income, CHART_COLORS.expense],
    legend: { position: 'top-right' as const },
    axis: {
      y: {
        labelFormatter: (v: number) =>
          new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(v),
      },
    },
    tooltip: {
      valueFormatter: (v: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(v),
    },
  }

  return (
    <Card title="Income vs Expense (Last 6 Months)" style={{ height: '100%' }}>
      <Column {...config} height={240} />
    </Card>
  )
}
