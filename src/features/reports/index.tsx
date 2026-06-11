import { useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import { Tabs, Alert } from 'antd'
import { PageHeader } from '@/shared/components/PageHeader/PageHeader'
import { MonthlySummaryReport } from './components/MonthlySummaryReport'
import { CategoryReport } from './components/CategoryReport'
import { MMCAnalysisReport } from './components/MMCAnalysisReport'
import { useMonthlyReport, useIncomeBreakdown, useExpenseBreakdown, useMMCReport } from './hooks/useReports'
import { useAppStore } from '@/shared/store/appStore'
import { useLocation } from 'react-router-dom'

const TAB_KEYS = {
  monthly: '/reports/monthly',
  income:  '/reports/income',
  expense: '/reports/expense',
  mmc:     '/reports/mmc',
}

function ReportContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const fy = useAppStore((s) => s.selectedFY)

  const monthlyQuery  = useMonthlyReport()
  const incomeQuery   = useIncomeBreakdown()
  const expenseQuery  = useExpenseBreakdown()
  const mmcQuery      = useMMCReport()

  const activeKey = Object.values(TAB_KEYS).find((k) => location.pathname.startsWith(k))
    ?? TAB_KEYS.monthly

  const tabs = [
    { key: TAB_KEYS.monthly, label: 'Monthly Summary' },
    { key: TAB_KEYS.income,  label: 'Income Analysis' },
    { key: TAB_KEYS.expense, label: 'Expense Analysis' },
    { key: TAB_KEYS.mmc,     label: 'MMC Analysis' },
  ]

  function renderContent() {
    switch (activeKey) {
      case TAB_KEYS.monthly:
        return <MonthlySummaryReport data={monthlyQuery.data} loading={monthlyQuery.isLoading} />
      case TAB_KEYS.income:
        return <CategoryReport title="Income by Category" data={incomeQuery.data} loading={incomeQuery.isLoading} />
      case TAB_KEYS.expense:
        return <CategoryReport title="Expense by Category" data={expenseQuery.data} loading={expenseQuery.isLoading} />
      case TAB_KEYS.mmc:
        return <MMCAnalysisReport data={mmcQuery.data} loading={mmcQuery.isLoading} />
      default:
        return null
    }
  }

  const anyError = monthlyQuery.error || incomeQuery.error || expenseQuery.error || mmcQuery.error

  return (
    <div>
      <PageHeader title="Financial Reports" subtitle={`Fiscal Year ${fy}`} />

      {anyError && (
        <Alert
          type="error"
          message="Failed to load report data"
          description={(anyError as Error).message}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs
        activeKey={activeKey}
        items={tabs}
        onChange={(key) => navigate(key)}
        style={{ marginBottom: 24 }}
      />

      {renderContent()}
    </div>
  )
}

export function ReportsPage() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="monthly" replace />} />
      <Route path="/*" element={<ReportContent />} />
    </Routes>
  )
}
