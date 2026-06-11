import { Row, Col, Card, Statistic, Progress, Skeleton } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { DashboardSummary } from '@/shared/types'
import { formatCurrency, formatPercentage, collectionRateColor, surplusColor } from '@/shared/utils/formatters'

interface Props {
  data: DashboardSummary | undefined
  loading: boolean
}

export function KPICards({ data, loading }: Props) {
  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} xl={6} key={i}>
            <Card><Skeleton active paragraph={{ rows: 2 }} /></Card>
          </Col>
        ))}
      </Row>
    )
  }

  const surplus = data?.currentMonth.surplus ?? 0
  const collectionPct = data?.mmcCollection.percentage ?? 0

  const cards = [
    {
      title: 'Monthly Income',
      value: formatCurrency(data?.currentMonth.income),
      prefix: <ArrowUpOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
      subtitle: data?.currentMonth.label ?? '',
    },
    {
      title: 'Monthly Expense',
      value: formatCurrency(data?.currentMonth.expense),
      prefix: <ArrowDownOutlined style={{ color: '#ff4d4f' }} />,
      color: '#ff4d4f',
      subtitle: data?.currentMonth.label ?? '',
    },
    {
      title: surplus >= 0 ? 'Monthly Surplus' : 'Monthly Deficit',
      value: formatCurrency(Math.abs(surplus)),
      prefix: surplus >= 0
        ? <ArrowUpOutlined style={{ color: surplusColor(surplus) }} />
        : <ArrowDownOutlined style={{ color: surplusColor(surplus) }} />,
      color: surplusColor(surplus),
      subtitle: 'Income − Expense',
    },
    {
      title: 'MMC Collection',
      value: formatPercentage(collectionPct),
      prefix: <TeamOutlined style={{ color: collectionRateColor(collectionPct) }} />,
      color: collectionRateColor(collectionPct),
      subtitle: `${data?.mmcCollection.collected ?? 0} of ${data?.mmcCollection.total ?? 0} collected`,
      extra: (
        <Progress
          percent={collectionPct}
          size="small"
          showInfo={false}
          strokeColor={collectionRateColor(collectionPct)}
          style={{ marginTop: 8 }}
        />
      ),
    },
  ]

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col xs={24} sm={12} xl={6} key={card.title}>
          <Card hoverable>
            <Statistic
              title={card.title}
              value={card.value}
              valueStyle={{ color: card.color, fontSize: 24 }}
              prefix={card.prefix}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>{card.subtitle}</div>
            {card.extra}
          </Card>
        </Col>
      ))}
    </Row>
  )
}
