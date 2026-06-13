import {
  AnalysisFilter,
  AnalysisRow,
  CategoryStat,
  MonthlyStat,
  PartyAggregate,
} from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDdMmYyyy(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
}

/** Returns e.g. "FY22-23" for any date in Apr 2022 – Mar 2023. */
export function dateToFy(ddMmYyyy: string): string {
  const d = parseDdMmYyyy(ddMmYyyy)
  if (!d) return 'Unknown'
  const year  = d.getFullYear()
  const month = d.getMonth() + 1  // 1-based
  const fyStart = month >= 4 ? year : year - 1
  return `FY${String(fyStart).slice(2)}-${String(fyStart + 1).slice(2)}`
}

/** Returns all unique FY strings present in the rows, sorted ascending. */
export function getAvailableFys(rows: AnalysisRow[]): string[] {
  const set = new Set(rows.map((r) => dateToFy(r.date)))
  return Array.from(set).sort()
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export function applyFilter(rows: AnalysisRow[], filter: AnalysisFilter): AnalysisRow[] {
  return rows.filter((row) => {
    const d = parseDdMmYyyy(row.date)
    if (!d) return false

    if (filter.dateRange) {
      const from = parseDdMmYyyy(filter.dateRange[0])
      const to   = parseDdMmYyyy(filter.dateRange[1])
      if (!from || !to) return false
      to.setHours(23, 59, 59)
      if (d < from || d > to) return false
    } else {
      if (filter.fys.length > 0 && !filter.fys.includes(dateToFy(row.date))) return false
      if (filter.month !== null && (d.getMonth() + 1) !== filter.month) return false
    }

    const amount = Math.max(row.expenditure ?? 0, row.income ?? 0)
    if (filter.minAmount > 0 && amount < filter.minAmount) return false

    return true
  })
}

// ─── Aggregations ─────────────────────────────────────────────────────────────

function buildPartyMap(
  rows: AnalysisRow[],
  field: 'expenditure' | 'income',
): Map<string, PartyAggregate> {
  const map = new Map<string, PartyAggregate>()
  for (const row of rows) {
    const amount = row[field]
    if (!amount || amount <= 0) continue
    const existing = map.get(row.vendorName)
    if (existing) {
      existing.totalAmount += amount
      existing.count++
    } else {
      map.set(row.vendorName, {
        vendorName:      row.vendorName,
        rawDescription:  row.rawDescription,
        totalAmount:     amount,
        count:           1,
      })
    }
  }
  return map
}

export function getTopDebitParties(rows: AnalysisRow[], topN: number): PartyAggregate[] {
  return Array.from(buildPartyMap(rows, 'expenditure').values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, topN)
}

export function getTopCreditParties(rows: AnalysisRow[], topN: number): PartyAggregate[] {
  return Array.from(buildPartyMap(rows, 'income').values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, topN)
}

export function getMonthlyCashFlow(rows: AnalysisRow[]): MonthlyStat[] {
  const map = new Map<string, { income: number; expense: number; sortKey: string }>()

  for (const row of rows) {
    const d = parseDdMmYyyy(row.date)
    if (!d) continue
    const mm   = d.getMonth() + 1
    const yyyy = d.getFullYear()
    const label   = `${MONTH_NAMES[mm - 1]} ${yyyy}`
    const sortKey = `${yyyy}-${String(mm).padStart(2, '0')}`
    const entry   = map.get(label) ?? { income: 0, expense: 0, sortKey }
    if (row.income)      entry.income  += row.income
    if (row.expenditure) entry.expense += row.expenditure
    map.set(label, entry)
  }

  const result: MonthlyStat[] = []
  for (const [monthLabel, { income, expense, sortKey }] of map) {
    result.push({ monthLabel, sortKey, type: 'Income',  amount: income })
    result.push({ monthLabel, sortKey, type: 'Expense', amount: expense })
  }
  return result.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
}

export function getCategoryTotals(
  rows: AnalysisRow[],
  mode: 'income' | 'expense',
): CategoryStat[] {
  const map = new Map<string, { amount: number; count: number }>()
  for (const row of rows) {
    const amount = mode === 'income' ? row.income : row.expenditure
    if (!amount || amount <= 0) continue
    const entry = map.get(row.category) ?? { amount: 0, count: 0 }
    entry.amount += amount
    entry.count++
    map.set(row.category, entry)
  }
  return Array.from(map.entries())
    .map(([category, { amount, count }]) => ({ category, amount, count }))
    .sort((a, b) => b.amount - a.amount)
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatAmount(n: number): string {
  if (n >= 10_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}K`
  return `₹${Math.round(n)}`
}

export function formatAmountFull(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Format "01/05/2026" → "May 01, 2026" */
export function formatDateDisplay(ddMmYyyy: string): string {
  const m = ddMmYyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ddMmYyyy
  const mon = MONTH_NAMES[parseInt(m[2]) - 1]
  return mon ? `${mon} ${m[1]}, ${m[3]}` : ddMmYyyy
}
