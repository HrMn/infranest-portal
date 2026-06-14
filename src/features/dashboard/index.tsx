import { useState, useMemo } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MultiSelect } from '@/components/ui/multi-select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { formatCurrency } from '@/shared/utils/formatters'
import { FISCAL_YEARS, FY_MONTHS, DEFAULT_FY } from '@/shared/utils/constants'
import type { FiscalYear } from '@/shared/utils/constants'
import type { Transaction } from '@/shared/types'

const FY_OPTIONS = FISCAL_YEARS.map((fy) => ({ value: fy, label: fy }))

const MONTH_MAP: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
}

function toMonthLabel(ddMmYyyy: string): string {
  const m = ddMmYyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ''
  return `${MONTH_MAP[m[2]]}-${m[3]}`
}

function yFmt(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000)   return `₹${(v / 1000).toFixed(0)}K`
  return `₹${v}`
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

interface MonthCardProps {
  month: string
  income: number
  expense: number
  maxIncome: number
  maxExpense: number
  onClick: () => void
}

function MonthCard({ month, income, expense, maxIncome, maxExpense, onClick }: MonthCardProps) {
  const iw = maxIncome  > 0 ? (income  / maxIncome)  * 100 : 0
  const ew = maxExpense > 0 ? (expense / maxExpense) * 100 : 0
  const hasData = income > 0 || expense > 0

  return (
    <button
      onClick={onClick}
      disabled={!hasData}
      className="w-full text-left rounded-lg border bg-card p-3 hover:shadow-md hover:border-primary/40 transition-all disabled:opacity-40 disabled:cursor-default group"
    >
      <p className="text-xs font-semibold mb-2.5 group-hover:text-primary transition-colors">{month}</p>
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-emerald-600 font-medium">Income</span>
            <span className="text-[10px] text-emerald-600 font-medium tabular-nums">
              {income > 0 ? formatCurrency(income) : '—'}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${iw}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-red-500 font-medium">Expense</span>
            <span className="text-[10px] text-red-500 font-medium tabular-nums">
              {expense > 0 ? formatCurrency(expense) : '—'}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${ew}%` }} />
          </div>
        </div>
      </div>
    </button>
  )
}

const PIE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#0ea5e9', '#f97316', '#14b8a6', '#ec4899', '#84cc16',
  '#06b6d4', '#e11d48',
]

function PieTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const pct  = ((item.payload?.percent ?? 0) * 100).toFixed(1)
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md space-y-0.5">
      <p className="font-medium">{item.name}</p>
      <p>{formatCurrency(item.value)}</p>
      <p className="text-muted-foreground">{pct}%</p>
    </div>
  )
}

function CategoryPie({ data }: { data: { category: string; amount: number }[] }) {
  if (data.length === 0) return <p className="py-6 text-sm text-muted-foreground">No data</p>
  const chartData = data.map((d) => ({ name: d.category, value: d.amount }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md space-y-0.5">
      <p className="font-medium mb-1">Day {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const MONTH_IDX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

export function DashboardPage() {
  const [selectedFYs, setSelectedFYs] = useState<string[]>([DEFAULT_FY])
  const [drillMonth,  setDrillMonth]  = useState<string | null>(null)
  const [drillDay,    setDrillDay]    = useState<number | null>(null)

  // Always fetch both FYs; TanStack Query deduplicates/caches automatically
  const q26 = useTransactions('FY26-27')
  const q25 = useTransactions('FY25-26')

  const isLoading =
    (selectedFYs.includes('FY26-27') && q26.isLoading) ||
    (selectedFYs.includes('FY25-26') && q25.isLoading)

  const transactions = useMemo<Transaction[]>(() => {
    const list: Transaction[] = []
    if (selectedFYs.includes('FY26-27') && q26.data) list.push(...q26.data)
    if (selectedFYs.includes('FY25-26') && q25.data) list.push(...q25.data)
    return list
  }, [selectedFYs, q26.data, q25.data])

  const months = useMemo(
    () => selectedFYs.flatMap((fy) => FY_MONTHS[fy as FiscalYear] ?? []),
    [selectedFYs],
  )

  const monthlyData = useMemo(() => {
    return months.map((month) => {
      const txns    = transactions.filter((t) => toMonthLabel(t.date) === month)
      const income  = txns.reduce((s, t) => s + (t.income      ?? 0), 0)
      const expense = txns.reduce((s, t) => s + (t.expenditure ?? 0), 0)
      return { month, income, expense, txns }
    })
  }, [months, transactions])

  const maxIncome  = useMemo(() => Math.max(0, ...monthlyData.map((m) => m.income)),  [monthlyData])
  const maxExpense = useMemo(() => Math.max(0, ...monthlyData.map((m) => m.expense)), [monthlyData])

  const monthTxns = useMemo(
    () => drillMonth ? (monthlyData.find((m) => m.month === drillMonth)?.txns ?? []) : [],
    [drillMonth, monthlyData],
  )

  const dailyData = useMemo(() => {
    if (!drillMonth) return []

    const map: Record<number, { income: number; expense: number }> = {}
    for (const t of monthTxns) {
      const dm = t.date.match(/^(\d{1,2})\//)
      if (!dm) continue
      const day = parseInt(dm[1])
      if (!map[day]) map[day] = { income: 0, expense: 0 }
      map[day].income  += t.income      ?? 0
      map[day].expense += t.expenditure ?? 0
    }

    const parts     = drillMonth.match(/^(\w{3})-(\d{4})$/)
    const totalDays = parts
      ? new Date(parseInt(parts[2]), MONTH_IDX[parts[1]] + 1, 0).getDate()
      : 31

    return Array.from({ length: totalDays }, (_, i) => ({
      day:     i + 1,
      income:  map[i + 1]?.income  ?? 0,
      expense: map[i + 1]?.expense ?? 0,
    }))
  }, [drillMonth, monthTxns])

  const totals = useMemo(() => {
    const income  = transactions.reduce((s, t) => s + (t.income      ?? 0), 0)
    const expense = transactions.reduce((s, t) => s + (t.expenditure ?? 0), 0)
    return { income, expense, net: income - expense }
  }, [transactions])

  // Three-level category filter: FY → month → day
  const categoryTransactions = useMemo(() => {
    if (!drillMonth) return transactions
    if (!drillDay)   return monthTxns
    return monthTxns.filter((t) => {
      const dm = t.date.match(/^(\d{1,2})\//)
      return dm && parseInt(dm[1]) === drillDay
    })
  }, [drillMonth, drillDay, transactions, monthTxns])

  const categoryData = useMemo(() => {
    const inc: Record<string, number> = {}
    const exp: Record<string, number> = {}
    for (const t of categoryTransactions) {
      const cat = t.category || t.paymentType || 'Other'
      if (t.income      && t.income      > 0) inc[cat] = (inc[cat] ?? 0) + t.income
      if (t.expenditure && t.expenditure > 0) exp[cat] = (exp[cat] ?? 0) + t.expenditure
    }
    const toArr = (m: Record<string, number>) =>
      Object.entries(m).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
    return { income: toArr(inc), expense: toArr(exp) }
  }, [categoryTransactions])

  function handleFyChange(v: string[]) {
    setSelectedFYs(v.length ? v : [DEFAULT_FY])
    setDrillMonth(null)
    setDrillDay(null)
  }

  function handleMonthClick(month: string) {
    setDrillMonth(month)
    setDrillDay(null)
  }

  function handleBack() {
    if (drillDay !== null) {
      setDrillDay(null)
    } else {
      setDrillMonth(null)
    }
  }

  // Breadcrumb label for pie card context
  const pieScope = drillDay !== null
    ? `${drillMonth} · Day ${drillDay}`
    : drillMonth ?? null

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* FY filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground shrink-0">Fiscal Year</span>
        <MultiSelect
          options={FY_OPTIONS}
          value={selectedFYs}
          onChange={handleFyChange}
          placeholder="Select FY…"
        />
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.income)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedFYs.join(', ')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Total Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.expense)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedFYs.join(', ')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-blue-500" /> Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedFYs.join(', ')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly overview / Daily drill-down */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {drillMonth && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CardTitle className="text-sm font-semibold">
              {drillMonth ? `${drillMonth} — Daily Breakdown` : 'Monthly Overview'}
            </CardTitle>
            {!drillMonth && (
              <span className="text-xs text-muted-foreground ml-1">(click a month to drill down)</span>
            )}
            {drillMonth && !drillDay && (
              <span className="text-xs text-muted-foreground ml-1">(click a bar to filter by day)</span>
            )}
            {drillDay !== null && (
              <span className="text-xs text-muted-foreground ml-1">— Day {drillDay} selected</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {drillMonth ? (
            dailyData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No transactions in {drillMonth}</p>
            ) : (
              <div className="overflow-x-auto">
                <BarChart
                  width={Math.max(560, dailyData.length * 64)}
                  height={320}
                  data={dailyData}
                  margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => {
                    if (data?.activeLabel != null) setDrillDay(Number(data.activeLabel))
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={(props) => {
                      const { x, y, payload } = props
                      const isSelected = Number(payload.value) === drillDay
                      return (
                        <text x={x} y={y + 10} textAnchor="middle" fontSize={11}
                          fontWeight={isSelected ? 700 : 400}
                          fill={isSelected ? 'hsl(var(--primary))' : '#888'}>
                          {payload.value}
                        </text>
                      )
                    }}
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
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[3,3,0,0]} maxBarSize={24}
                    onClick={(row: { day: number }) => setDrillDay(row.day)}
                  />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3,3,0,0]} maxBarSize={24}
                    onClick={(row: { day: number }) => setDrillDay(row.day)}
                  />
                </BarChart>
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {monthlyData.map((m) => (
                <MonthCard
                  key={m.month}
                  month={m.month}
                  income={m.income}
                  expense={m.expense}
                  maxIncome={maxIncome}
                  maxExpense={maxExpense}
                  onClick={() => handleMonthClick(m.month)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category breakdown */}
      {(categoryData.income.length > 0 || categoryData.expense.length > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-emerald-700">
                Income by Category
                {pieScope && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({pieScope})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CategoryPie data={categoryData.income} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-red-600">
                Expense by Category
                {pieScope && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({pieScope})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CategoryPie data={categoryData.expense} />
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}
