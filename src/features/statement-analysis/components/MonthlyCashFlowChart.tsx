import { useMemo } from 'react'
import { Card, Empty, Row, Col, Statistic, Typography, Space } from 'antd'
import { Line } from '@ant-design/charts'
import { AnalysisRow } from '../types'
import { getMonthlyCashFlow, formatAmount, formatAmountFull } from '../utils/analyticsHelpers'

const { Text } = Typography

// Colors keyed by series name so the style function and legend both agree
const SERIES_COLORS: Record<string, string> = {
  Income:  '#52c41a',
  Expense: '#ff4d4f',
}

interface Props {
  rows: AnalysisRow[]
}

export function MonthlyCashFlowChart({ rows }: Props) {
  const monthlyData = useMemo(() => getMonthlyCashFlow(rows), [rows])

  const totals = useMemo(() => {
    const income  = rows.reduce((s, r) => s + (r.income      ?? 0), 0)
    const expense = rows.reduce((s, r) => s + (r.expenditure ?? 0), 0)
    return { income, expense, net: income - expense }
  }, [rows])

  if (monthlyData.length === 0) {
    return (
      <Card size="small" title="Monthly Cash Flow">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data for the selected filters" />
      </Card>
    )
  }

  const config = {
    data:       monthlyData,
    xField:     'monthLabel',
    yField:     'amount',
    colorField: 'type',
    smooth:     true,

    // Per-series color using G2 v5 style function
    style: (d: { type: string }) => ({
      stroke:    SERIES_COLORS[d.type] ?? '#1677ff',
      lineWidth: 2.5,
    }),

    // Dots on each data point
    point: {
      style: (d: { type: string }) => ({
        fill: SERIES_COLORS[d.type] ?? '#1677ff',
        r:    3,
      }),
    },

    tooltip: {
      items: [
        { channel: 'y', name: 'Amount', valueFormatter: (v: number) => formatAmountFull(v) },
      ],
    },

    axis: {
      x: {
        label: {
          autoHide:   true,
          autoRotate: true,
          style:      { fontSize: 10 },
        },
      },
      y: {
        label: {
          formatter: (v: string | number) => formatAmount(Number(v)),
        },
      },
    },

    legend: {
      color: { position: 'top-right' as const },
    },
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <Text strong>Monthly Cash Flow</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>income vs expense over time</Text>
        </Space>
      }
    >
      {/* Summary stats row */}
      <Row gutter={32} style={{ marginBottom: 12 }}>
        <Col>
          <Statistic
            title="Total Income"
            value={totals.income}
            prefix="₹"
            valueStyle={{ color: '#52c41a', fontSize: 16 }}
            formatter={(v) => Number(v).toLocaleString('en-IN')}
          />
        </Col>
        <Col>
          <Statistic
            title="Total Expense"
            value={totals.expense}
            prefix="₹"
            valueStyle={{ color: '#ff4d4f', fontSize: 16 }}
            formatter={(v) => Number(v).toLocaleString('en-IN')}
          />
        </Col>
        <Col>
          <Statistic
            title="Net"
            value={Math.abs(totals.net)}
            prefix={totals.net >= 0 ? '+₹' : '-₹'}
            valueStyle={{ color: totals.net >= 0 ? '#1677ff' : '#fa8c16', fontSize: 16 }}
            formatter={(v) => Number(v).toLocaleString('en-IN')}
          />
        </Col>
      </Row>

      <Line {...config} height={300} />
    </Card>
  )
}
