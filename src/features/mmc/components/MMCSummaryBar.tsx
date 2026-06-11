import { Row, Col, Card, Statistic, Progress, Skeleton } from 'antd'
import { MMCStatus } from '@/shared/types'
import { collectionRateColor } from '@/shared/utils/formatters'

interface Props {
  summary: MMCStatus['summary'] | undefined
  loading: boolean
}

export function MMCSummaryBar({ summary, loading }: Props) {
  if (loading) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
    )
  }

  const rate = summary?.collectionRateThisMonth ?? 0

  return (
    <Card style={{ marginBottom: 16 }}>
      <Row gutter={24} align="middle">
        <Col xs={12} sm={6} md={4}>
          <Statistic title="Total Apartments" value={summary?.totalApartments ?? 0} />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Statistic title="Occupied" value={summary?.occupiedApartments ?? 0} />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Statistic
            title="Collected (This Month)"
            value={summary?.collectedThisMonth ?? 0}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Statistic
            title="Outstanding"
            value={summary?.outstandingThisMonth ?? 0}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
        <Col xs={24} md={8}>
          <div style={{ fontSize: 13, color: '#595959', marginBottom: 6 }}>
            Collection Rate — {summary?.currentMonth ?? ''}: <strong>{rate}%</strong>
          </div>
          <Progress
            percent={rate}
            strokeColor={collectionRateColor(rate)}
            size="default"
          />
        </Col>
      </Row>
    </Card>
  )
}
