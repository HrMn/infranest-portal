import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/shared/utils/formatters'
import {
  useBankStatementSummary,
  useBankStatementMonthly,
  useBankStatementDaily,
} from './hooks/useBankStatement'
import { useState, useMemo } from 'react'
import type { BankStatementYear } from '@/shared/types'

// ── Constants ─────────────────────────────────────────────────────────────────

// Latest FY first so the bar chart reads left-to-right from newest to oldest
const ALL_FYS = [
  'FY26-27', 'FY25-26', 'FY24-25', 'FY23-24', 'FY22-23', 'FY21-22',
  'FY20-21', 'FY19-20', 'FY18-19', 'FY17-18',
]

const CURRENT_FY = 'FY26-27'

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Helpers ───────────────────────────────────────────────────────────────────

function yFmt(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000)   return `₹${(v / 1000).toFixed(0)}K`
  return `₹${v}`
}

function monthLabel(key: string) {
  const [mm, yyyy] = key.split('/')
  return `${MONTH_ABBR[parseInt(mm) - 1]}-${yyyy}`
}


function GroupedTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number | null; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const hasData = payload.some((p) => p.value !== null && p.value !== undefined)
  if (!hasData) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: '#111' }}>{label}</p>
      {payload.map((p) =>
        p.value !== null && p.value !== undefined ? (
          <p key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0', color: '#333' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
            {p.name}: <strong>{formatCurrency(p.value)}</strong>
          </p>
        ) : null,
      )}
    </div>
  )
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({ selectedFY, onBack }: { selectedFY: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
      <button className="hover:text-foreground transition-colors" onClick={onBack}>
        All Years
      </button>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground font-medium">{selectedFY}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BankStatementPage() {
  const [selectedFY, setSelectedFY]               = useState<string | null>(null)
  const [selectedMonthKey, setSelectedMonthKey]   = useState<string | null>(null)
  const [selectedMonthLabel, setSelectedMonthLabel] = useState<string | null>(null)

  const { data: summary,  isLoading: summaryLoading  } = useBankStatementSummary()
  const { data: monthly,  isLoading: monthlyLoading  } = useBankStatementMonthly(selectedFY)
  const { data: daily,    isLoading: dailyLoading    } = useBankStatementDaily(selectedFY, selectedMonthKey)

  const months       = monthly?.months       ?? []
  const transactions = daily?.transactions   ?? []

  // Year chart: all FYs, latest first, blank bars for unconfigured ones
  const yearChartData = useMemo(() => {
    const dataMap: Record<string, BankStatementYear> = {}
    ;(summary?.years ?? []).forEach((y) => { dataMap[y.fy] = y })
    return ALL_FYS.map((fy) => ({
      fy,
      openingBalance: dataMap[fy]?.openingBalance ?? null,
      closingBalance: dataMap[fy]?.closingBalance ?? null,
    }))
  }, [summary])

  // Month chart: only show months that have actual data
  const monthChartData = useMemo(() => months, [months])

  // Transaction summary for selected month
  const txnSummary = useMemo(() => {
    const totalCredit = transactions.reduce((s, t) => s + (t.credit ?? 0), 0)
    const totalDebit  = transactions.reduce((s, t) => s + (t.debit  ?? 0), 0)
    return { totalCredit, totalDebit, net: totalCredit - totalDebit, count: transactions.length }
  }, [transactions])

  function handleYearClick(fy: string) {
    const entry = summary?.years.find((y) => y.fy === fy)
    if (!entry) return
    setSelectedFY(fy)
    setSelectedMonthKey(null)
    setSelectedMonthLabel(null)
  }

  function handleMonthClick(monthKey: string, label: string) {
    setSelectedMonthKey((prev) => prev === monthKey ? null : monthKey)
    setSelectedMonthLabel(label)
  }

  function goBack() {
    setSelectedFY(null)
    setSelectedMonthKey(null)
    setSelectedMonthLabel(null)
  }

  if (summaryLoading) {
    return <div className="space-y-5"><Skeleton className="h-72 rounded-xl" /></div>
  }

  const currentFYData = summary?.years.find((y) => y.fy === CURRENT_FY)

  // ── Year view ──────────────────────────────────────────────────────────────
  if (!selectedFY) {
    return (
      <div className="space-y-4">
      {currentFYData && (
        <div className="rounded-lg border bg-indigo-50 border-indigo-100 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="font-semibold text-indigo-700">Current Balance ({CURRENT_FY})</span>
          <span className="text-indigo-900 font-bold text-base">{formatCurrency(currentFYData.closingBalance)}</span>
          <span className="text-xs text-indigo-500">as of {currentFYData.lastTxnDate}</span>
          {currentFYData.openingBalance !== null && (
            <span className="text-indigo-700 text-xs">
              Opened at {formatCurrency(currentFYData.openingBalance)} ·{' '}
              <span className={currentFYData.closingBalance >= currentFYData.openingBalance ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                {currentFYData.closingBalance >= currentFYData.openingBalance ? '+' : '−'}
                {formatCurrency(Math.abs(currentFYData.closingBalance - currentFYData.openingBalance))}
              </span>
            </span>
          )}
        </div>
      )}
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-semibold">Year-wise Bank Balance</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Opening vs closing balance · Click a bar to see monthly breakdown
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={yearChartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }} barCategoryGap="30%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="fy" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={yFmt} width={64} />
              <Tooltip content={<GroupedTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="openingBalance" name="Opening" fill="#a5b4fc" radius={[4,4,0,0]} maxBarSize={32}
                style={{ cursor: 'pointer' }} onClick={(d: { fy: string }) => handleYearClick(d.fy)} />
              <Bar dataKey="closingBalance" name="Closing" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={32}
                style={{ cursor: 'pointer' }} onClick={(d: { fy: string }) => handleYearClick(d.fy)} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </div>
    )
  }

  // ── Month view + transaction detail ───────────────────────────────────────
  return (
    <div className="space-y-5">
      <Breadcrumb selectedFY={selectedFY} onBack={goBack} />

      {/* Monthly bar chart */}
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-semibold">Monthly Balance — {selectedFY}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Opening vs closing balance per month · Click a bar to see transactions below
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {monthlyLoading ? (
            <Skeleton className="h-72 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthChartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }} barCategoryGap="25%" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={yFmt} width={64} />
                <Tooltip content={<GroupedTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="openingBalance" name="Opening" fill="#a5b4fc" radius={[4,4,0,0]} maxBarSize={28}
                  style={{ cursor: 'pointer' }}
                  onClick={(d: { monthKey: string; month: string }) => handleMonthClick(d.monthKey, d.month)} />
                <Bar dataKey="closingBalance" name="Closing" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={28}
                  style={{ cursor: 'pointer' }}
                  onClick={(d: { monthKey: string; month: string }) => handleMonthClick(d.monthKey, d.month)} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Transaction detail — shown inline below chart */}
      {selectedMonthKey && (
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">
              Transactions — {selectedMonthLabel} {selectedFY}
            </CardTitle>

            {/* Inline summary */}
            {!dailyLoading && transactions.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs">
                <span className="text-muted-foreground">
                  Credits:{' '}
                  <span className="text-green-600 font-semibold">{formatCurrency(txnSummary.totalCredit)}</span>
                </span>
                <span className="text-muted-foreground">
                  Debits:{' '}
                  <span className="text-red-500 font-semibold">{formatCurrency(txnSummary.totalDebit)}</span>
                </span>
                <span className="text-muted-foreground">
                  Net:{' '}
                  <span className={txnSummary.net >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                    {txnSummary.net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(txnSummary.net))}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Transactions:{' '}
                  <span className="text-foreground font-semibold">{txnSummary.count}</span>
                </span>
              </div>
            )}
          </CardHeader>

          <CardContent className="px-4 pb-4 pt-0">
            {dailyLoading ? (
              <Skeleton className="h-48 rounded-lg" />
            ) : transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No transactions in {selectedMonthLabel}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 pr-3 text-left font-medium w-16">Date</th>
                      <th className="py-2 pr-3 text-left font-medium">Description</th>
                      <th className="py-2 pr-3 text-right font-medium w-28">Debit</th>
                      <th className="py-2 pr-3 text-right font-medium w-28">Credit</th>
                      <th className="py-2 text-right font-medium w-28">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{t.date}</td>
                        <td className="py-2 pr-3 text-foreground leading-snug">{t.description}</td>
                        <td className="py-2 pr-3 text-right text-red-500 whitespace-nowrap">
                          {t.debit ? formatCurrency(t.debit) : '—'}
                        </td>
                        <td className="py-2 pr-3 text-right text-green-600 whitespace-nowrap">
                          {t.credit ? formatCurrency(t.credit) : '—'}
                        </td>
                        <td className="py-2 text-right font-medium whitespace-nowrap">
                          {formatCurrency(t.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
