import { useState, useMemo } from 'react'
import { FileText, Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { formatCurrency } from '@/shared/utils/formatters'
import { FISCAL_YEARS, DEFAULT_FY } from '@/shared/utils/constants'
import type { Transaction } from '@/shared/types'

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMN_DEFS = [
  { key: 'date',        label: 'Date',           defaultOn: true  },
  { key: 'particulars', label: 'Particulars',     defaultOn: true  },
  { key: 'category',    label: 'Category',        defaultOn: true  },
  { key: 'apartment',   label: 'Unit/Apartment',  defaultOn: false },
  { key: 'income',      label: 'Income',          defaultOn: true  },
  { key: 'expense',     label: 'Expense',         defaultOn: true  },
  { key: 'mode',        label: 'Payment Mode',    defaultOn: false },
  { key: 'receiptNo',   label: 'Receipt No',      defaultOn: false },
  { key: 'remarks',     label: 'Remarks',         defaultOn: false },
  { key: 'status',      label: 'Status',          defaultOn: false },
]

type TypeFilter = 'all' | 'income' | 'expense'

const FY_OPTIONS   = FISCAL_YEARS.map(fy => ({ value: fy, label: fy }))
const TYPE_OPTIONS = [
  { value: 'all',     label: 'All'     },
  { value: 'income',  label: 'Income'  },
  { value: 'expense', label: 'Expense' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(ddMmYyyy: string): string {
  const m = ddMmYyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ddMmYyyy
  const mon = MONTH_NAMES[parseInt(m[2]) - 1]
  return mon ? `${mon} ${m[1]}, ${m[3]}` : ddMmYyyy
}

function parseDateNum(ddMmYyyy: string): number {
  const m = ddMmYyyy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return m ? parseInt(m[3] + m[2].padStart(2, '0') + m[1].padStart(2, '0')) : 0
}

function isoToAppDate(iso: string): string {
  if (!iso) return ''
  const [y, mo, d] = iso.split('-')
  return `${d}/${mo}/${y}`
}

function isoToDisplay(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [selectedFYs,  setSelectedFYs]  = useState<string[]>([DEFAULT_FY])
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>('all')
  const [categories,   setCategories]   = useState<string[]>([])
  const [enabledCols,  setEnabledCols]  = useState<Set<string>>(
    () => new Set(COLUMN_DEFS.filter(c => c.defaultOn).map(c => c.key)),
  )
  const [previewData,  setPreviewData]  = useState<Transaction[] | null>(null)

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

  const categoryOptions = useMemo(() => {
    const cats = new Set<string>()
    transactions.forEach(t => { if (t.paymentType) cats.add(t.paymentType) })
    return Array.from(cats).sort().map(c => ({ value: c, label: c }))
  }, [transactions])

  function toggleCol(key: string) {
    setEnabledCols(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function generatePreview() {
    const fromNum = dateFrom ? parseDateNum(isoToAppDate(dateFrom)) : 0
    const toNum   = dateTo   ? parseDateNum(isoToAppDate(dateTo))   : Infinity

    const result = transactions.filter(t => {
      const n = parseDateNum(t.date)
      if (fromNum && n < fromNum) return false
      if (toNum !== Infinity && n > toNum) return false
      if (categories.length > 0 && !categories.includes(t.paymentType || '')) return false
      if (typeFilter === 'income'  && !(t.income      && t.income      > 0)) return false
      if (typeFilter === 'expense' && !(t.expenditure && t.expenditure > 0)) return false
      return true
    })

    result.sort((a, b) => parseDateNum(a.date) - parseDateNum(b.date))
    setPreviewData(result)
  }

  const totals = useMemo(() => {
    if (!previewData) return null
    return {
      income:  previewData.reduce((s, t) => s + (t.income      ?? 0), 0),
      expense: previewData.reduce((s, t) => s + (t.expenditure ?? 0), 0),
    }
  }, [previewData])

  const activeCols = COLUMN_DEFS.filter(c => enabledCols.has(c.key))

  const reportTitle = typeFilter === 'income' ? 'Income Report'
    : typeFilter === 'expense' ? 'Expense Report'
    : 'Transaction Report'

  const dateRangeLabel = (dateFrom || dateTo)
    ? `${dateFrom ? isoToDisplay(dateFrom) : 'Beginning'} – ${dateTo ? isoToDisplay(dateTo) : 'Today'}`
    : selectedFYs.join(', ')

  const generatedOn = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="space-y-4">

      {/* ── Filters + Column selector (hidden on print) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 print:hidden">

        {/* Filters */}
        <Card className="lg:col-span-2">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">Filters</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Fiscal Year</Label>
                <MultiSelect
                  options={FY_OPTIONS}
                  value={selectedFYs}
                  onChange={v => { setSelectedFYs(v.length ? v : [DEFAULT_FY]); setPreviewData(null) }}
                  placeholder="Select FY…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <MultiSelect
                  options={categoryOptions}
                  value={categories}
                  onChange={setCategories}
                  placeholder="All Categories"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date From</Label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date To</Label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Transaction Type</Label>
              <ToggleGroup
                value={typeFilter}
                options={TYPE_OPTIONS}
                onChange={v => setTypeFilter(v as TypeFilter)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Column selector */}
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">Columns</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
              {COLUMN_DEFS.map(col => (
                <label key={col.key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enabledCols.has(col.key)}
                    onChange={() => toggleCol(col.key)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  <span className="text-xs">{col.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Action buttons (hidden on print) ── */}
      <div className="flex items-center gap-3 print:hidden">
        <Button onClick={generatePreview} disabled={isLoading} className="gap-1.5">
          <FileText className="h-4 w-4" />
          {isLoading ? 'Loading data…' : 'Generate Preview'}
        </Button>
        {previewData && (
          <Button variant="outline" onClick={() => window.print()} className="gap-1.5">
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </Button>
        )}
        {previewData && (
          <span className="text-xs text-muted-foreground">
            {previewData.length} transaction{previewData.length !== 1 ? 's' : ''} matched
          </span>
        )}
      </div>

      {/* ── Report Preview ── */}
      {previewData && (
        <Card>
          <CardContent className="p-6 print:p-0 print:shadow-none print:border-0">

            {/* Report header */}
            <div className="mb-5 text-center space-y-0.5">
              <h1 className="text-base font-bold">{reportTitle}</h1>
              <p className="text-xs text-muted-foreground">{dateRangeLabel}</p>
              {categories.length > 0 && (
                <p className="text-xs text-muted-foreground">Category: {categories.join(', ')}</p>
              )}
              <p className="text-xs text-muted-foreground">Generated on {generatedOn}</p>
            </div>

            {/* KPI strip */}
            {totals && (
              <div className="grid grid-cols-3 gap-3 mb-5 rounded-lg border bg-muted/30 p-3">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Total Income</p>
                  <p className="text-sm font-bold text-emerald-600 tabular-nums">{formatCurrency(totals.income)}</p>
                </div>
                <div className="text-center border-x">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Total Expense</p>
                  <p className="text-sm font-bold text-red-600 tabular-nums">{formatCurrency(totals.expense)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Net</p>
                  <p className={`text-sm font-bold tabular-nums ${totals.income - totals.expense >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {totals.income - totals.expense >= 0 ? '+' : ''}{formatCurrency(totals.income - totals.expense)}
                  </p>
                </div>
              </div>
            )}

            {/* Table */}
            {previewData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No transactions match the selected filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="py-2 pr-3 text-left font-semibold text-muted-foreground w-7">#</th>
                      {activeCols.map(col => (
                        <th
                          key={col.key}
                          className={`py-2 px-2 font-semibold text-muted-foreground whitespace-nowrap
                            ${col.key === 'income' || col.key === 'expense' ? 'text-right' : 'text-left'}`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((t, i) => (
                      <tr key={t.transactionId || t.rowIndex} className="border-b border-border/50">
                        <td className="py-1.5 pr-3 text-muted-foreground">{i + 1}</td>
                        {activeCols.map(col => (
                          <td
                            key={col.key}
                            className={`py-1.5 px-2
                              ${col.key === 'income' || col.key === 'expense' ? 'text-right tabular-nums' : ''}`}
                          >
                            {col.key === 'date'        && formatDate(t.date)}
                            {col.key === 'particulars' && (
                              <span className="block max-w-[220px] truncate print:max-w-none print:whitespace-normal" title={t.particulars}>
                                {t.particulars}
                              </span>
                            )}
                            {col.key === 'category'    && (t.paymentType || '—')}
                            {col.key === 'apartment'   && (t.apartment   || '—')}
                            {col.key === 'income'      && (t.income && t.income > 0
                              ? <span className="font-medium text-emerald-600">{formatCurrency(t.income)}</span>
                              : '')}
                            {col.key === 'expense'     && (t.expenditure && t.expenditure > 0
                              ? <span className="font-medium text-red-600">{formatCurrency(t.expenditure)}</span>
                              : '')}
                            {col.key === 'mode'        && (t.paymentMode || '—')}
                            {col.key === 'receiptNo'   && (t.receiptNo   || '—')}
                            {col.key === 'remarks'     && (t.remarks     || '—')}
                            {col.key === 'status'      && (t.status      || '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border">
                      <td colSpan={1 + activeCols.length} className="py-2 px-2 text-right text-xs font-semibold text-muted-foreground">
                        {previewData.length} transaction{previewData.length !== 1 ? 's' : ''}
                        {totals && totals.income  > 0 && ` · Income: ${formatCurrency(totals.income)}`}
                        {totals && totals.expense > 0 && ` · Expense: ${formatCurrency(totals.expense)}`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
