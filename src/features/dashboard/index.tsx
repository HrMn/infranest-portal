import { Row, Col, Alert } from 'antd'
import { PageHeader } from '@/shared/components/PageHeader/PageHeader'
import { KPICards } from './components/KPICards'
import { MonthlyTrendChart } from './components/MonthlyTrendChart'
import { BreakdownChart } from './components/BreakdownChart'
import { useDashboardSummary } from './hooks/useDashboardSummary'
import { useAppStore } from '@/shared/store/appStore'

export function DashboardPage() {
  const fy = useAppStore((s) => s.selectedFY)
  const { data, isLoading, error } = useDashboardSummary()

  return (
    <div>
      <PageHeader title="Financial Dashboard" subtitle={`Fiscal Year ${fy}`} />

      {error && (
        <Alert
          type="error"
          message="Failed to load dashboard data"
          description={(error as Error).message}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[0, 16]}>
        <Col span={24}>
          <KPICards data={data} loading={isLoading} />
        </Col>

        <Col span={24}>
          <MonthlyTrendChart data={data?.monthlyTrend} loading={isLoading} />
        </Col>

        <Col xs={24} lg={12}>
          <BreakdownChart
            title="Income Breakdown"
            data={data?.incomeBreakdown}
            loading={isLoading}
          />
        </Col>

        <Col xs={24} lg={12}>
          <BreakdownChart
            title="Expense Breakdown"
            data={data?.expenseBreakdown}
            loading={isLoading}
          />
        </Col>
      </Row>
    </div>
  )
}
