import { useState } from 'react'
import {
  Card, Select, DatePicker, InputNumber,
  Radio, Space, Button, Divider, Segmented, Tooltip, Tag,
} from 'antd'
import { FilterOutlined, ClearOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { AnalysisFilter } from '../types'
import { MONTH_NAMES } from '../utils/analyticsHelpers'

dayjs.extend(customParseFormat)

const { RangePicker } = DatePicker

const MONTH_OPTIONS = MONTH_NAMES.map((name, i) => ({
  label: name,
  value: i + 1,
}))

interface Props {
  filter:       AnalysisFilter
  availableFys: string[]
  onChange:     (f: AnalysisFilter) => void
}

type FilterMode = 'fy' | 'custom'

export function FilterBar({ filter, availableFys, onChange }: Props) {
  const [mode, setMode] = useState<FilterMode>(filter.dateRange ? 'custom' : 'fy')

  function patch(partial: Partial<AnalysisFilter>) {
    onChange({ ...filter, ...partial })
  }

  function switchMode(m: FilterMode) {
    setMode(m)
    if (m === 'fy')     patch({ dateRange: null })
    if (m === 'custom') patch({ fys: [], month: null, dateRange: null })
  }

  function handleRangePicker(dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) {
    if (!dates || !dates[0] || !dates[1]) {
      patch({ dateRange: null })
    } else {
      patch({
        dateRange: [
          dates[0].format('DD/MM/YYYY'),
          dates[1].format('DD/MM/YYYY'),
        ],
      })
    }
  }

  function clearAll() {
    setMode('fy')
    onChange({
      fys:        [],
      month:      null,
      dateRange:  null,
      minAmount:  filter.minAmount,
      topN:       filter.topN,
    })
  }

  const hasActiveFilters =
    filter.fys.length > 0 ||
    filter.month !== null ||
    filter.dateRange !== null

  return (
    <Card
      size="small"
      style={{ marginBottom: 16 }}
      bodyStyle={{ paddingTop: 10, paddingBottom: 10 }}
    >
      <Space wrap align="center" size={[16, 8]}>
        <FilterOutlined style={{ color: '#8c8c8c' }} />

        {/* Mode toggle */}
        <Segmented
          size="small"
          value={mode}
          onChange={(v) => switchMode(v as FilterMode)}
          options={[
            { label: 'By FY / Month', value: 'fy' },
            { label: 'Custom Range', value: 'custom' },
          ]}
        />

        <Divider type="vertical" />

        {mode === 'fy' ? (
          <>
            {/* FY chips */}
            <Space size={4} wrap>
              {availableFys.length === 0 ? (
                <Tag style={{ fontSize: 12, color: '#bfbfbf' }}>No data</Tag>
              ) : (
                availableFys.map((fy) => (
                  <Tag.CheckableTag
                    key={fy}
                    checked={filter.fys.includes(fy)}
                    onChange={(checked) =>
                      patch({
                        fys: checked
                          ? [...filter.fys, fy]
                          : filter.fys.filter((f) => f !== fy),
                      })
                    }
                    style={{ fontSize: 12 }}
                  >
                    {fy}
                  </Tag.CheckableTag>
                ))
              )}
            </Space>

            <Divider type="vertical" />

            {/* Month selector */}
            <Tooltip title="Filter by month within the selected FY(s)">
              <Select
                size="small"
                placeholder="All months"
                allowClear
                style={{ width: 120 }}
                value={filter.month}
                onChange={(v) => patch({ month: v ?? null })}
                options={MONTH_OPTIONS}
              />
            </Tooltip>
          </>
        ) : (
          /* Custom date range picker */
          <RangePicker
            size="small"
            format="DD/MM/YYYY"
            value={
              filter.dateRange
                ? [
                    dayjs(filter.dateRange[0], 'DD/MM/YYYY'),
                    dayjs(filter.dateRange[1], 'DD/MM/YYYY'),
                  ]
                : null
            }
            onChange={handleRangePicker}
            allowClear
          />
        )}

        <Divider type="vertical" />

        {/* Min amount */}
        <Tooltip title="Hide transactions below this amount">
          <InputNumber
            size="small"
            prefix="₹ ≥"
            min={0}
            step={1000}
            value={filter.minAmount || undefined}
            placeholder="Min ₹"
            style={{ width: 110 }}
            onChange={(v) => patch({ minAmount: v ?? 0 })}
          />
        </Tooltip>

        <Divider type="vertical" />

        {/* Top N */}
        <Space size={4}>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>Top</span>
          <Radio.Group
            size="small"
            value={filter.topN}
            onChange={(e) => patch({ topN: e.target.value })}
            optionType="button"
          >
            <Radio.Button value={10}>10</Radio.Button>
            <Radio.Button value={20}>20</Radio.Button>
          </Radio.Group>
        </Space>

        {hasActiveFilters && (
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={clearAll}
            type="link"
            danger
          >
            Clear
          </Button>
        )}
      </Space>
    </Card>
  )
}
