import { useState, useMemo } from 'react'
import { Card, Progress, Tooltip, Typography, Space, Tag, Empty } from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { AnalysisRow, PartyAggregate } from '../types'
import {
  getTopDebitParties,
  getTopCreditParties,
  formatAmountFull,
} from '../utils/analyticsHelpers'
import { PartyDrilldownDrawer } from './PartyDrilldownDrawer'

const { Text } = Typography

// ─── Shared list component ────────────────────────────────────────────────────

interface PartyListProps {
  parties:   PartyAggregate[]
  direction: 'debit' | 'credit'
  onSelect:  (p: PartyAggregate) => void
}

function PartyList({ parties, direction, onSelect }: PartyListProps) {
  const maxAmount = parties[0]?.totalAmount ?? 1
  const color     = direction === 'debit' ? '#ff4d4f' : '#52c41a'
  const gradient  = direction === 'debit'
    ? { '0%': '#ff7875', '100%': '#ff4d4f' }
    : { '0%': '#95de64', '100%': '#52c41a' }

  if (parties.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No data for the selected filters"
        style={{ padding: '20px 0' }}
      />
    )
  }

  return (
    <div>
      {parties.map((p, i) => (
        <div
          key={p.vendorName}
          onClick={() => onSelect(p)}
          style={{
            padding:      '9px 8px',
            borderRadius: 6,
            cursor:       'pointer',
            marginBottom: 2,
            transition:   'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          {/* Name + amount row */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
            {/* Left: rank + name */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text
                type="secondary"
                style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', flexShrink: 0, width: 24, textAlign: 'right' }}
              >
                #{i + 1}
              </Text>
              <Tooltip title={p.rawDescription} placement="topLeft">
                <Text
                  style={{ fontSize: 13, flex: 1, minWidth: 0 }}
                  ellipsis
                >
                  {p.vendorName}
                </Text>
              </Tooltip>
            </div>

            {/* Right: count badge + amount */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12, flexShrink: 0 }}>
              <Tag style={{ fontSize: 11, margin: 0, lineHeight: '18px', color: '#8c8c8c' }}>
                {p.count} txn{p.count > 1 ? 's' : ''}
              </Tag>
              <Text strong style={{ fontSize: 13, color, minWidth: 90, textAlign: 'right' }}>
                {formatAmountFull(p.totalAmount)}
              </Text>
            </div>
          </div>

          {/* Progress bar */}
          <Progress
            percent={Math.round((p.totalAmount / maxAmount) * 100)}
            showInfo={false}
            strokeColor={gradient}
            trailColor="#f0f0f0"
            size={['100%', 6]}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Panel wrappers ───────────────────────────────────────────────────────────

interface PanelProps {
  rows: AnalysisRow[]
  topN: number
}

export function TopDebitPartiesPanel({ rows, topN }: PanelProps) {
  const [selected, setSelected] = useState<PartyAggregate | null>(null)
  const parties = useMemo(() => getTopDebitParties(rows, topN), [rows, topN])

  return (
    <Card
      size="small"
      title={
        <Space>
          <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
          <Text strong>Top Debit Parties</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>where most money went</Text>
        </Space>
      }
      styles={{ body: { maxHeight: 480, overflowY: 'auto' } }}
    >
      <PartyList parties={parties} direction="debit" onSelect={setSelected} />
      <PartyDrilldownDrawer
        party={selected}
        rows={rows}
        direction="debit"
        onClose={() => setSelected(null)}
      />
    </Card>
  )
}

export function TopCreditPartiesPanel({ rows, topN }: PanelProps) {
  const [selected, setSelected] = useState<PartyAggregate | null>(null)
  const parties = useMemo(() => getTopCreditParties(rows, topN), [rows, topN])

  return (
    <Card
      size="small"
      title={
        <Space>
          <ArrowUpOutlined style={{ color: '#52c41a' }} />
          <Text strong>Top Credit Parties</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>where most money came from</Text>
        </Space>
      }
      styles={{ body: { maxHeight: 480, overflowY: 'auto' } }}
    >
      <PartyList parties={parties} direction="credit" onSelect={setSelected} />
      <PartyDrilldownDrawer
        party={selected}
        rows={rows}
        direction="credit"
        onClose={() => setSelected(null)}
      />
    </Card>
  )
}
