import { useState } from 'react'
import {
  BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Dot,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/shared/utils/formatters'
import { useBankStatementSummary, useBankStatementMonthly } from './hooks/useBankStatement'

// ── Helpers ───────────────────────────────────────────────────────────────────

function yFmt(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000)   return `₹${(v / 1000).toFixed(0)}K`
  return `₹${v}`
}

function BarTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md space-y-0.5">
      <p className="font-semibold">{label}</p>
      <p className="text-indigo-600">Closing Balance: {formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function LineTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md space-y-0.5">
      <p className="font-semibold">{label}</p>
      <p className="text-indigo-600">Balance: {formatCurrency(payload[0].value)}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BankStatementPage() {
  const [selectedFY, setSelectedFY] = useState<string | null>(null)

  const { data: summary, isLoading: summaryLoading } = useBankStatementSummary()
  const { data: detail,  isLoading: detailLoading  } = useBankStatementMonthly(selectedFY)

  const years = summary?.years ?? []

  function handleBarClick(data: { fy: string }) {
    setSelectedFY((prev) => (prev === data.fy ? null : data.fy))
  }

  if (summaryLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  if (years.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        No bank statement files found in the "Bank Statements" Drive folder.
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Year-wise closing balance bar chart ── */}
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-semibold">Year-wise Bank Closing Balance</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click a bar to see month-wise balance for that fiscal year
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={years}
              margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="fy"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={yFmt}
                width={64}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar
                dataKey="closingBalance"
                name="Closing Balance"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
                onClick={handleBarClick}
              >
                {years.map((entry) => (
                  <Cell
                    key={entry.fy}
                    fill={entry.fy === selectedFY ? '#6366f1' : '#a5b4fc'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Monthly closing balance line chart ── */}
      {selectedFY && (
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">
              Monthly Closing Balance — {selectedFY}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              End-of-month bank balance for each month in the fiscal year
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {detailLoading ? (
              <Skeleton className="h-64 rounded-lg" />
            ) : !detail || detail.months.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No data available for {selectedFY}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={detail.months}
                  margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={yFmt}
                    width={64}
                  />
                  <Tooltip content={<LineTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Closing Balance"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={<Dot r={4} fill="#6366f1" />}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
