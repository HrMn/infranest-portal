import { useMemo } from 'react'
import { Drawer, Table, Tag, Tooltip, Typography, Statistic, Row, Col, Divider } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { AnalysisRow, PartyAggregate } from '../types'
import { formatAmountFull, formatDateDisplay } from '../utils/analyticsHelpers'

const { Text } = Typography

interface Props {
  party:     PartyAggregate | null
  rows:      AnalysisRow[]      // already-filtered rows from the dashboard
  direction: 'debit' | 'credit'
  onClose:   () => void
}

export function PartyDrilldownDrawer({ party, rows, direction, onClose }: Props) {
  const partyRows = useMemo(() => {
    if (!party) return []
    return rows
      .filter((r) => {
        if (r.vendorName !== party.vendorName) return false
        return direction === 'debit' ? (r.expenditure ?? 0) > 0 : (r.income ?? 0) > 0
      })
      .sort((a, b) => {
        // Sort descending by date
        const da = a.date.split('/').reverse().join('')
        const db = b.date.split('/').reverse().join('')
        return db.localeCompare(da)
      })
  }, [party, rows, direction])

  const totalAmount = partyRows.reduce(
    (s, r) => s + (direction === 'debit' ? (r.expenditure ?? 0) : (r.income ?? 0)),
    0,
  )

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      width: 120,
      render: (d: string) => formatDateDisplay(d),
    },
    {
      title: 'Description',
      dataIndex: 'rawDescription',
      render: (desc: string) => (
        <Tooltip title={desc} placement="topLeft">
          <Text style={{ maxWidth: 260, display: 'block' }} ellipsis>
            {desc}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      width: 140,
      render: (c: string) => <Tag style={{ fontSize: 11 }}>{c}</Tag>,
    },
    {
      title: 'Amount',
      align: 'right' as const,
      width: 130,
      render: (_: unknown, r: AnalysisRow) => {
        const amount = direction === 'debit' ? r.expenditure : r.income
        return (
          <Text strong style={{ color: direction === 'debit' ? '#ff4d4f' : '#52c41a' }}>
            {formatAmountFull(amount ?? 0)}
          </Text>
        )
      },
    },
  ]

  return (
    <Drawer
      title={
        <span>
          {direction === 'debit'
            ? <ArrowDownOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />
            : <ArrowUpOutlined   style={{ color: '#52c41a', marginRight: 6 }} />}
          {party?.vendorName}
        </span>
      }
      open={!!party}
      onClose={onClose}
      width={620}
      destroyOnClose
    >
      {party && (
        <>
          <Row gutter={24} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Statistic
                title={direction === 'debit' ? 'Total Debited' : 'Total Credited'}
                value={totalAmount}
                precision={2}
                prefix="₹"
                valueStyle={{ color: direction === 'debit' ? '#ff4d4f' : '#52c41a', fontSize: 18 }}
                formatter={(v) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Transactions"
                value={partyRows.length}
                valueStyle={{ fontSize: 18 }}
              />
            </Col>
          </Row>

          <Divider style={{ margin: '0 0 12px' }} />

          <Table
            size="small"
            dataSource={partyRows}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (t) => `${t} rows` }}
          />
        </>
      )}
    </Drawer>
  )
}
