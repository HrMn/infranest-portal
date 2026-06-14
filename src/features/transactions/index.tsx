import { useState, useMemo } from 'react'
import { useAppStore } from '@/shared/store/appStore'
import { useTransactions } from './hooks/useTransactions'
import { useAuthStore } from '@/shared/store/authStore'
import { Transaction } from '@/shared/types'
import { formatCurrency } from '@/shared/utils/formatters'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, hasPermission } from '@/shared/utils/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup } from '@/components/ui/toggle-group'
import {
  Upload, Search, RefreshCw,
  ArrowUpDown, ArrowUp, ArrowDown, X, ChevronRight, ChevronDown,
  CheckCircle2, Clock, Loader2, Plus, TrendingUp, TrendingDown, Wallet,
} from 'lucide-react'
import { ImportStatementModal } from './components/ImportStatementModal'
import { TransactionExpandedPanel } from './components/TransactionExpandedPanel'
import { AddTransactionModal } from './components/AddTransactionModal'
import { FYSelector } from '@/shared/components/AppLayout/FYSelector'
import { useConfigData } from '@/features/config/hooks/useConfig'
import { useUpdateTransaction, useVerifyTransaction } from './hooks/useTransactions'

const MONTH_OPTIONS = [
  { value: '04', label: 'April' },    { value: '05', label: 'May' },
  { value: '06', label: 'June' },     { value: '07', label: 'July' },
  { value: '08', label: 'August' },   { value: '09', label: 'September' },
  { value: '10', label: 'October' },  { value: '11', label: 'November' },
  { value: '12', label: 'December' }, { value: '01', label: 'January' },
  { value: '02', label: 'February' }, { value: '03', label: 'March' },
]

type TypeFilter = 'all' | 'income' | 'expense'
type ModeFilter = 'all' | 'online' | 'cash'
type SortCol    = 'date' | 'income' | 'expense'
type SortDir    = 'asc' | 'desc'

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all',     label: 'All'     },
  { value: 'income',  label: 'Income'  },
  { value: 'expense', label: 'Expense' },
]

const MODE_OPTIONS: { value: ModeFilter; label: string }[] = [
  { value: 'all',    label: 'All'    },
  { value: 'online', label: 'Online' },
  { value: 'cash',   label: 'Cash'   },
]

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function formatDate(ddMmYyyy: string): string {
  const m = ddMmYyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ddMmYyyy
  const mon = MONTH_NAMES[parseInt(m[2]) - 1]
  return mon ? `${mon} ${m[1]}, ${m[3]}` : ddMmYyyy
}

export function TransactionsPage() {
  const fy        = useAppStore((s) => s.selectedFY)
  const user      = useAuthStore((s) => s.user)
  const privilege = user?.privilege
  const canCreate = privilege ? hasPermission(privilege, 'create:transaction') : false
  const canEdit   = privilege ? hasPermission(privilege, 'edit:transaction')   : false
  const canVerify = privilege ? hasPermission(privilege, 'verify:transaction') : false
  const canImport = privilege ? hasPermission(privilege, 'import:statement')   : false

  const { data: transactions, isLoading, refetch, isFetching } = useTransactions(fy)

  const { data: configData } = useConfigData(fy, 'CATEGORY')
  const categories = useMemo(() => {
    const configured = (configData?.items ?? []).filter((i) => i.status === 'Active').map((i) => i.key)
    return configured.length > 0 ? configured : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]
  }, [configData])

  const [search,          setSearch]          = useState('')
  const [monthFilter,     setMonthFilter]     = useState<string[]>([])
  const [categoryFilter,  setCategoryFilter]  = useState<string[]>([])
  const [typeFilter,      setTypeFilter]      = useState<TypeFilter>('all')
  const [modeFilter,      setModeFilter]      = useState<ModeFilter>('all')
  const [sortCol,         setSortCol]         = useState<SortCol>('date')
  const [sortDir,         setSortDir]         = useState<SortDir>('desc')
  const categoryOptions = useMemo(() => {
    const cats = new Set<string>()
    ;(transactions ?? []).forEach((t) => { if (t.paymentType) cats.add(t.paymentType) })
    return Array.from(cats).sort().map((c) => ({ value: c, label: c }))
  }, [transactions])

  const [importOpen,     setImportOpen]     = useState(false)
  const [addOpen,        setAddOpen]        = useState(false)
  const [page,           setPage]           = useState(1)
  const [expandedRowIdx, setExpandedRowIdx] = useState<number | null>(null)
  const PAGE_SIZE = 20

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('desc') }
    setPage(1)
  }

  const filtered = useMemo(() => {
    if (!transactions) return []
    const list = transactions.filter((t) => {
      if (monthFilter.length > 0) {
        const m = t.date.match(/^(\d{2})\/(\d{2})\//)
        if (!m || !monthFilter.includes(m[2])) return false
      }
      if (categoryFilter.length > 0 && !categoryFilter.includes(t.paymentType || '')) return false
      if (typeFilter === 'income'  && !(t.income      && t.income      > 0)) return false
      if (typeFilter === 'expense' && !(t.expenditure && t.expenditure > 0)) return false
      if (modeFilter === 'online' && t.paymentMode?.toLowerCase() === 'cash') return false
      if (modeFilter === 'cash'   && t.paymentMode?.toLowerCase() !== 'cash') return false
      if (search) {
        const q = search.toLowerCase()
        return (
          t.particulars.toLowerCase().includes(q) ||
          t.apartment?.toLowerCase().includes(q)  ||
          t.paymentMode?.toLowerCase().includes(q)||
          t.paymentType?.toLowerCase().includes(q)
        )
      }
      return true
    })

    list.sort((a, b) => {
      let cmp = 0
      if (sortCol === 'date') {
        const toNum = (d: string) => {
          const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
          return m ? parseInt(m[3] + m[2] + m[1]) : 0
        }
        cmp = toNum(a.date) - toNum(b.date)
      } else if (sortCol === 'income') {
        cmp = (a.income ?? 0) - (b.income ?? 0)
      } else {
        cmp = (a.expenditure ?? 0) - (b.expenditure ?? 0)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [transactions, monthFilter, categoryFilter, typeFilter, modeFilter, search, sortCol, sortDir])

  const filteredTotals = useMemo(() => ({
    income:  filtered.reduce((s, t) => s + (t.income      ?? 0), 0),
    expense: filtered.reduce((s, t) => s + (t.expenditure ?? 0), 0),
  }), [filtered])

  function handleFilterChange(setter: (v: string) => void, v: string) {
    setter(v); setPage(1)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    setExpandedRowIdx(null)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Transactions table */}
      <Card>
        <CardHeader className="px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">Transactions</CardTitle>
              <FYSelector />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {canCreate && (
                <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="h-8 gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> New
                </Button>
              )}
              {canImport && (
                <Button size="sm" onClick={() => setImportOpen(true)} className="h-8 gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Import
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search transactions…"
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <MultiSelect
              options={MONTH_OPTIONS}
              value={monthFilter}
              onChange={(v) => { setMonthFilter(v); setPage(1) }}
              placeholder="All Months"
            />
            <MultiSelect
              options={categoryOptions}
              value={categoryFilter}
              onChange={(v) => { setCategoryFilter(v); setPage(1) }}
              placeholder="All Categories"
            />
            <ToggleGroup
              value={typeFilter}
              options={TYPE_OPTIONS}
              onChange={(v) => handleFilterChange(setTypeFilter, v)}
            />
            <ToggleGroup
              value={modeFilter}
              options={MODE_OPTIONS}
              onChange={(v) => handleFilterChange(setModeFilter, v)}
            />
            {(sortCol !== 'date' || sortDir !== 'desc') && (
              <button
                onClick={() => { setSortCol('date'); setSortDir('desc'); setPage(1) }}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 px-2.5 py-1 text-xs text-primary hover:bg-primary/15 transition-colors"
              >
                {sortCol === 'date' ? 'Date' : sortCol === 'income' ? 'Income' : 'Expense'}
                {sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                <X className="h-3 w-3 opacity-60" />
              </button>
            )}
          </div>

          {/* Filtered totals */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2.5 mt-0.5">
            <span className="text-[11px] text-muted-foreground">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1 text-[11px]">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-muted-foreground">Income</span>
              <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(filteredTotals.income)}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-muted-foreground">Expense</span>
              <span className="font-semibold text-red-600 tabular-nums">{formatCurrency(filteredTotals.expense)}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <Wallet className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Net</span>
              <span className={`font-semibold tabular-nums ${filteredTotals.income - filteredTotals.expense >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {filteredTotals.income - filteredTotals.expense >= 0 ? '+' : ''}{formatCurrency(filteredTotals.income - filteredTotals.expense)}
              </span>
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <SortableHeader label="Date"    col="date"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-28 text-left" />
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Particulars</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-36">Category</th>
                  <SortableHeader label="Income"  col="income"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-24 text-right" />
                  <SortableHeader label="Expense" col="expense" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-24 text-right" />
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-20">Mode</th>
                  <th className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground w-10" title="Verification status">✓</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  paginated.map((t) => (
                    <TransactionRow
                      key={t.transactionId || t.rowIndex}
                      txn={t}
                      fy={fy}
                      canEdit={canEdit}
                      canVerify={canVerify}
                      isExpanded={expandedRowIdx === t.rowIndex}
                      onToggle={() => setExpandedRowIdx((prev) => prev === t.rowIndex ? null : t.rowIndex)}
                      categories={categories}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                {filtered.length} results · page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1} onClick={() => handlePageChange(page - 1)}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === totalPages} onClick={() => handlePageChange(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ImportStatementModal
        open={importOpen}
        fy={fy}
        onClose={() => setImportOpen(false)}
        onImported={(count) => {
          refetch()
          // eslint-disable-next-line no-console
          console.log(`Imported ${count} transactions`)
        }}
      />

      <AddTransactionModal
        open={addOpen}
        currentFY={fy}
        onClose={() => setAddOpen(false)}
      />
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function SortableHeader({
  label, col, sortCol, sortDir, onSort, className,
}: {
  label: string
  col: SortCol
  sortCol: SortCol
  sortDir: SortDir
  onSort: (c: SortCol) => void
  className?: string
}) {
  const active = sortCol === col
  const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <th className={`px-4 py-2.5 text-xs font-medium text-muted-foreground ${className ?? ''}`}>
      <button
        onClick={() => onSort(col)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        <Icon className={`h-3 w-3 ${active ? 'text-primary' : 'opacity-40'}`} />
      </button>
    </th>
  )
}

interface RowProps {
  txn: Transaction
  fy: string
  canEdit: boolean
  canVerify: boolean
  isExpanded: boolean
  onToggle: () => void
  categories: string[]
}

function TransactionRow({ txn, fy, canEdit, canVerify, isExpanded, onToggle, categories }: RowProps) {
  const verify   = useVerifyTransaction(fy)
  const isIncome = txn.income && txn.income > 0
  const status   = txn.status === 'Verified' ? 'Verified' : 'Pending Verification'

  async function handleStatusToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (!canVerify) return
    const newStatus = status === 'Verified' ? 'Pending Verification' : 'Verified'
    await verify.mutateAsync({ rowIndex: txn.rowIndex, status: newStatus })
  }

  return (
    <>
      <tr
        className={`hover:bg-muted/30 transition-colors cursor-pointer select-none ${isExpanded ? 'bg-muted/20' : ''}`}
        onClick={onToggle}
      >
        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(txn.date)}
        </td>
        <td className="px-4 py-2.5 max-w-xs">
          <p className="text-xs font-medium text-foreground truncate" title={txn.particulars}>
            {txn.particulars}
          </p>
        </td>
        <td className="px-4 py-2.5">
          <span className="text-xs text-muted-foreground">{txn.paymentType || '—'}</span>
        </td>
        <td className="px-4 py-2.5 text-right">
          {isIncome ? (
            <span className="text-xs font-medium text-emerald-600">{formatCurrency(txn.income!)}</span>
          ) : null}
        </td>
        <td className="px-4 py-2.5 text-right">
          {txn.expenditure && txn.expenditure > 0 ? (
            <span className="text-xs font-medium text-red-600">{formatCurrency(txn.expenditure)}</span>
          ) : null}
        </td>
        <td className="px-4 py-2.5">
          <span className="text-xs text-muted-foreground">{txn.paymentMode}</span>
        </td>
        <td className="px-2 py-2.5 text-center">
          <button
            onClick={handleStatusToggle}
            disabled={!canVerify || verify.isPending}
            title={canVerify ? status : 'Verification requires Admin or Super Admin privilege'}
            className="rounded p-0.5 hover:bg-muted/60 transition-colors disabled:opacity-40"
          >
            {verify.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : status === 'Verified' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-amber-400" />
            )}
          </button>
        </td>
        <td className="px-2 py-2.5 text-center">
          {isExpanded
            ? <ChevronDown  className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-auto" />}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <TransactionExpandedPanel
              txn={txn}
              fy={fy}
              canEdit={canEdit}
              categories={categories}
              onClose={onToggle}
            />
          </td>
        </tr>
      )}
    </>
  )
}
