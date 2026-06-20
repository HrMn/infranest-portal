import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Dot,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/shared/utils/formatters'
import { cn } from '@/lib/utils'
import { useFinancialSummaryOverall, useFinancialSummaryDetail } from './hooks/useFinancialSummary'
import type { FinancialSummaryValues } from '@/shared/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined): string {
  if (v == null) return '—'
  return formatCurrency(v)
}

function yFmt(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000)   return `₹${(v / 1000).toFixed(0)}K`
  return `₹${v}`
}

function pct(a: number | null, b: number | null): string {
  if (!a || !b) return ''
  const diff = ((b - a) / Math.abs(a)) * 100
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`
}

const TH  = 'px-3 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap'
const THL = 'px-3 py-2 text-left  text-xs font-semibold text-muted-foreground whitespace-nowrap'
const TD  = 'px-3 py-2 text-right text-xs tabular-nums whitespace-nowrap'
const TDL = 'px-3 py-2 text-left  text-xs whitespace-nowrap'

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryFooterRow({ label, values }: { label: string; values: FinancialSummaryValues }) {
  return (
    <tr className="border-b last:border-0">
      <td className={cn(TDL, 'font-semibold')}>{label}</td>
      <td className={cn(TD, 'text-muted-foreground')}>{fmt(values.cashInHand)}</td>
      <td className={cn(TD, 'text-muted-foreground')}>{fmt(values.bank)}</td>
      <td className={cn(TD, 'font-bold')}>{fmt(values.total)}</td>
    </tr>
  )
}

function LineTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function FinancialSummaryPage() {
  const [selectedFY, setSelectedFY] = useState<string | null>(null)

  const { data: overall, isLoading: overallLoading } = useFinancialSummaryOverall()
  const { data: detail,  isLoading: detailLoading  } = useFinancialSummaryDetail(selectedFY)

  // Table: newest first
  const rows = useMemo(() => [...(overall?.rows ?? [])].reverse(), [overall])

  // Chart: oldest first — one point per FY boundary (opening of first FY + closing of each FY)
  // This produces a continuous line: Apr 2017 → Mar 2018 → Mar 2019 → … Mar 2025
  const trendData = useMemo(() => {
    const sorted = [...(overall?.rows ?? [])] // already oldest-first from sheet
    if (sorted.length === 0) return []

    const points: { period: string; cashInHand: number; bank: number }[] = []

    // First point: opening of the earliest FY
    const first     = sorted[0]
    const startYear = first.fy.split('-')[0]
    points.push({
      period:      `Apr ${startYear}`,
      cashInHand:  first.openingCashInHand ?? 0,
      bank:        first.openingBank       ?? 0,
    })

    // One closing point per FY
    sorted.forEach((row) => {
      const endYear = row.fy.split('-')[1]
      points.push({
        period:     `Mar ${endYear}`,
        cashInHand: row.closingCashInHand ?? 0,
        bank:       row.closingBank       ?? 0,
      })
    })

    return points
  }, [overall])

  // Monthly bar chart
  const chartData = useMemo(
    () => (detail?.months ?? []).map((m) => ({
      month:   m.month.slice(0, 3),
      income:  m.incomeTotal  ?? 0,
      expense: m.expenseTotal ?? 0,
    })),
    [detail],
  )

  if (overallLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Cash Position Trajectory ── */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">Cash Position Over the Years</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each point marks the start or end of a fiscal year — the line shows the continuous cash trajectory
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={48}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={yFmt}
                  width={64}
                />
                <Tooltip content={<LineTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                <Line
                  type="monotone"
                  dataKey="cashInHand"
                  name="Cash In Hand"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={<Dot r={3} fill="#f97316" />}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="bank"
                  name="Cash At Bank"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={<Dot r={3} fill="#6366f1" />}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Year-by-Year Table ── */}
      {rows.length > 0 && (
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">Year-by-Year Overview</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click a row to see monthly cash flow details
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className={THL} rowSpan={2}>Fiscal Year</th>
                    <th className={cn(TH, 'text-center')} colSpan={3}>Opening Balance</th>
                    <th className={cn(TH, 'text-center border-l')} colSpan={3}>Closing Balance</th>
                    <th className={cn(TH, 'border-l')} rowSpan={2}>Net Change</th>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <th className={TH}>Cash In Hand</th>
                    <th className={TH}>Cash At Bank</th>
                    <th className={TH}>Total</th>
                    <th className={cn(TH, 'border-l')}>Cash In Hand</th>
                    <th className={TH}>Cash At Bank</th>
                    <th className={TH}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const active = selectedFY === row.fy
                    const net    = (row.closingTotal ?? 0) - (row.openingTotal ?? 0)
                    const isPos  = net >= 0
                    return (
                      <tr
                        key={row.fy}
                        onClick={() => setSelectedFY(active ? null : row.fy)}
                        className={cn(
                          'border-b cursor-pointer transition-colors',
                          active ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/40',
                        )}
                      >
                        <td className={cn(TDL, 'font-medium')}>
                          {active && <span className="mr-1.5 text-primary text-[10px]">▶</span>}
                          {row.fy}
                        </td>
                        <td className={TD}>{fmt(row.openingCashInHand)}</td>
                        <td className={TD}>{fmt(row.openingBank)}</td>
                        <td className={cn(TD, 'font-semibold')}>{fmt(row.openingTotal)}</td>
                        <td className={cn(TD, 'border-l')}>{fmt(row.closingCashInHand)}</td>
                        <td className={TD}>{fmt(row.closingBank)}</td>
                        <td className={cn(TD, 'font-semibold')}>{fmt(row.closingTotal)}</td>
                        <td className={cn(
                          TD, 'border-l font-semibold',
                          isPos ? 'text-emerald-600' : 'text-red-500',
                        )}>
                          {isPos ? '▲' : '▼'} {fmt(Math.abs(net))}
                          <span className="ml-1 text-[10px] font-normal opacity-70">
                            {pct(row.openingTotal, row.closingTotal)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Monthly Cash Flow Detail ── */}
      {selectedFY && (
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">
              Monthly Cash Flow — FY {selectedFY}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {detailLoading ? (
              <Skeleton className="h-64 rounded-lg" />
            ) : !detail || detail.months.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No data available for FY {selectedFY}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className={THL} rowSpan={2}>Month</th>
                        <th className={cn(TH, 'text-center text-emerald-700')} colSpan={3}>Income</th>
                        <th className={cn(TH, 'text-center text-red-600 border-l')} colSpan={3}>Expense</th>
                      </tr>
                      <tr className="border-b bg-muted/30">
                        <th className={cn(TH, 'text-emerald-700')}>Cash In Hand</th>
                        <th className={cn(TH, 'text-emerald-700')}>Cash At Bank</th>
                        <th className={cn(TH, 'text-emerald-700')}>Total</th>
                        <th className={cn(TH, 'text-red-600 border-l')}>Cash In Hand</th>
                        <th className={cn(TH, 'text-red-600')}>Cash At Bank</th>
                        <th className={cn(TH, 'text-red-600')}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.months.map((m) => (
                        <tr key={m.month} className="border-b hover:bg-muted/30 transition-colors">
                          <td className={cn(TDL, 'font-medium')}>{m.month}</td>
                          <td className={TD}>{fmt(m.incomeCashInHand)}</td>
                          <td className={TD}>{fmt(m.incomeBank)}</td>
                          <td className={cn(TD, 'font-semibold text-emerald-700')}>{fmt(m.incomeTotal)}</td>
                          <td className={cn(TD, 'border-l')}>{fmt(m.expenseCashInHand)}</td>
                          <td className={TD}>{fmt(m.expenseBank)}</td>
                          <td className={cn(TD, 'font-semibold text-red-600')}>{fmt(m.expenseTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {detail.summary && (
                  <div className="mt-4 border-t pt-3">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className={THL}></th>
                            <th className={TH}>Cash In Hand</th>
                            <th className={TH}>Cash At Bank</th>
                            <th className={TH}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <SummaryFooterRow label="Difference in Income / Expense" values={detail.summary.difference} />
                          <SummaryFooterRow label="Carry Forwarded"               values={detail.summary.carryForward} />
                          <SummaryFooterRow label="Closing Balance"               values={detail.summary.closingBalance} />
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Monthly Bar Chart ── */}
      {selectedFY && chartData.length > 0 && (
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">
              Monthly Income vs Expense — FY {selectedFY}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={yFmt} width={64} />
                <Tooltip
                  formatter={(v: any) => formatCurrency(Number(v))}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[3,3,0,0]} maxBarSize={28} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3,3,0,0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
