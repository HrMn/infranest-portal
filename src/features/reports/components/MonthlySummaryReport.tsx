import { Table, Card, Row, Col, Statistic, Skeleton } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Column } from '@ant-design/charts'
import { MonthlySummaryRow, MonthlyReport } from '@/shared/types'
import { formatCurrency, surplusColor } from '@/shared/utils/formatters'
import { CHART_COLORS } from '@/shared/utils/constants'

interface Props {
  data: MonthlyReport | undefined
  loading: boolean
}

export function MonthlySummaryReport({ data, loading }: Props) {
  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />

  const columns: ColumnsType<MonthlySummaryRow> = [
    { title: 'Month', dataIndex: 'month', key: 'month', width: 110 },
    {
      title: 'Income',
      dataIndex: 'income',
      key: 'income',
      align: 'right',
      render: (v: number) => <span style={{ color: CHART_COLORS.income }}>{formatCurrency(v)}</span>,
    },
    {
      title: 'Expense',
      dataIndex: 'expense',
      key: 'expense',
      align: 'right',
      render: (v: number) => <span style={{ color: CHART_COLORS.expense }}>{formatCurrency(v)}</span>,
    },
    {
      title: 'Surplus / Deficit',
      dataIndex: 'surplus',
      key: 'surplus',
      align: 'right',
      render: (v: number) => (
        <strong style={{ color: surplusColor(v) }}>{formatCurrency(v)}</strong>
      ),
    },
    {
      title: 'Cumulative Balance',
      dataIndex: 'cumulativeBalance',
      key: 'cumulativeBalance',
      align: 'right',
      render: (v: number) => formatCurrency(v),
    },
  ]

  const chartData = (data?.rows ?? []).flatMap((r) => [
    { month: r.month, type: 'Income',  value: r.income },
    { month: r.month, type: 'Expense', value: r.expense },
  ])

  return (
    <div>
      {/* Totals */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={8}>
          <Card>
            <Statistic
              title="Total Income"
              value={formatCurrency(data?.totals.income)}
              valueStyle={{ color: CHART_COLORS.income }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card>
            <Statistic
              title="Total Expense"
              value={formatCurrency(data?.totals.expense)}
              valueStyle={{ color: CHART_COLORS.expense }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card>
            <Statistic
              title="Net Surplus"
              value={formatCurrency(data?.totals.surplus)}
              valueStyle={{ color: surplusColor(data?.totals.surplus ?? 0) }}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card style={{ marginBottom: 24 }}>
        <Column
          data={chartData}
          xField="month"
          yField="value"
          colorField="type"
          group
          color={[CHART_COLORS.income, CHART_COLORS.expense]}
          height={220}
          legend={{ position: 'top-right' }}
        />
      </Card>

      {/* Table */}
      <Table<MonthlySummaryRow>
        dataSource={data?.rows}
        columns={columns}
        rowKey="month"
        size="small"
        pagination={false}
        bordered
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0}><strong>Total</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              <strong style={{ color: CHART_COLORS.income }}>{formatCurrency(data?.totals.income)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right">
              <strong style={{ color: CHART_COLORS.expense }}>{formatCurrency(data?.totals.expense)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right">
              <strong style={{ color: surplusColor(data?.totals.surplus ?? 0) }}>
                {formatCurrency(data?.totals.surplus)}
              </strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} />
          </Table.Summary.Row>
        )}
      />
    </div>
  )
}
