import { useEffect, useMemo, useState } from 'react'
import { Col, Row, Typography, Spin, Alert, Empty } from 'antd'
import { AnalysisFilter } from '../types'
import { useStatementAnalysisStore } from '../store/statementAnalysisStore'
import { applyFilter, getAvailableFys } from '../utils/analyticsHelpers'
import { UploadPanel }              from './UploadPanel'
import { FilterBar }                from './FilterBar'
import { TopDebitPartiesPanel, TopCreditPartiesPanel } from './TopPartiesChart'
import { MonthlyCashFlowChart }     from './MonthlyCashFlowChart'
import { CategoryBreakdownChart }   from './CategoryBreakdownChart'
import { TransactionSearchTable }   from './TransactionSearchTable'

const { Title } = Typography

const DEFAULT_FILTER: AnalysisFilter = {
  fys:       [],
  month:     null,
  dateRange: null,
  minAmount: 0,
  topN:      10,
}

export function StatementAnalysisPage() {
  const { rows, loading, error, loadFromDb } = useStatementAnalysisStore()
  const [filter, setFilter] = useState<AnalysisFilter>(DEFAULT_FILTER)

  // Load persisted data once on mount
  useEffect(() => { loadFromDb() }, [])

  const availableFys   = useMemo(() => getAvailableFys(rows), [rows])
  const filteredRows   = useMemo(() => applyFilter(rows, filter), [rows, filter])

  const hasData = rows.length > 0

  return (
    <div>
      <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
        Statement Analysis
      </Title>

      {error && (
        <Alert type="error" message={`Storage error: ${error}`} style={{ marginBottom: 12 }} />
      )}

      <Spin spinning={loading}>
        {/* Upload panel — always visible */}
        <UploadPanel />

        {hasData && (
          <>
            {/* Filter bar */}
            <FilterBar
              filter={filter}
              availableFys={availableFys}
              onChange={setFilter}
            />

            {filteredRows.length === 0 ? (
              <Empty
                description="No transactions match the current filters. Try widening the date range."
                style={{ padding: '40px 0' }}
              />
            ) : (
              <>
                {/* Row 1: Top Debit | Top Credit */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} lg={12}>
                    <TopDebitPartiesPanel  rows={filteredRows} topN={filter.topN} />
                  </Col>
                  <Col xs={24} lg={12}>
                    <TopCreditPartiesPanel rows={filteredRows} topN={filter.topN} />
                  </Col>
                </Row>

                {/* Row 2: Monthly Cash Flow — full width */}
                <Row style={{ marginBottom: 16 }}>
                  <Col span={24}>
                    <MonthlyCashFlowChart rows={filteredRows} />
                  </Col>
                </Row>

                {/* Row 3: Category Breakdown | Transaction Table */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={9}>
                    <CategoryBreakdownChart rows={filteredRows} />
                  </Col>
                  <Col xs={24} lg={15}>
                    <TransactionSearchTable rows={filteredRows} />
                  </Col>
                </Row>
              </>
            )}
          </>
        )}
      </Spin>
    </div>
  )
}
