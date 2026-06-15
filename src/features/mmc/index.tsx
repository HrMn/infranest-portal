import { useState, useMemo } from 'react'
import { Search, Pencil, IndianRupee, CalendarCheck, AlertCircle, ChevronUp, ChevronDown, ChevronsUpDown, TrendingUp, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useMMCStatus, useMMCPaid, useUpdateMMCPayment } from './hooks/useMMC'
import { MMCRateModal } from './components/MMCRateModal'
import { useAppStore } from '@/shared/store/appStore'
import { usePermission } from '@/shared/hooks/usePermission'
import { formatCurrency } from '@/shared/utils/formatters'
import { FISCAL_YEARS, type FiscalYear } from '@/shared/utils/constants'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'dues' | 'paid'
type SortDir  = 'asc' | 'desc'
interface SortState { col: string; dir: SortDir }

interface EditCell {
  apartment: string
  owner: string
  month: string
  contextAmount: number | null
  contextLabel: string  // "Outstanding Due" | "Previously Paid"
}

// ── Helpers ───────────────────────────────────────────────────────────────────


const MONTH_ABBR: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}
function parseMonthLabel(label: string): Date | null {
  const [mon, yr] = label.split('-')
  const mi = MONTH_ABBR[mon]
  const y  = parseInt(yr)
  if (mi === undefined || isNaN(y)) return null
  return new Date(y, mi, 1)
}

function SortIcon({ col, sort }: { col: string; sort: SortState | null }) {
  if (!sort || sort.col !== col) return <ChevronsUpDown className="h-3 w-3 opacity-40" />
  return sort.dir === 'asc'
    ? <ChevronUp className="h-3 w-3" />
    : <ChevronDown className="h-3 w-3" />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MMCPage() {
  const globalFY = useAppStore((s) => s.selectedFY)
  const canEdit  = usePermission('verify:transaction')

  const [fy,           setFy]          = useState<FiscalYear>(globalFY)
  const [viewMode,     setViewMode]    = useState<ViewMode>('dues')
  const [search,       setSearch]      = useState('')
  const [sort,         setSort]        = useState<SortState | null>(null)
  const [editCell,     setEditCell]    = useState<EditCell | null>(null)
  const [editAmount,   setEditAmount]  = useState('')
  const [rateCardOpen, setRateCardOpen] = useState(false)

  // Prefetch both so switching views is instant
  const { data: duesData, isLoading: duesLoading } = useMMCStatus(fy)
  const { data: paidData, isLoading: paidLoading } = useMMCPaid(fy)
  const updatePayment = useUpdateMMCPayment(fy)

  const isLoading = viewMode === 'dues' ? duesLoading : paidLoading

  // Current date for future-month detection on the frontend
  const now           = useMemo(() => new Date(), [])
  const thisMonthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now])
  const isMonthFuture = (label: string) => {
    const d = parseMonthLabel(label)
    return d !== null && d > thisMonthStart
  }

  const months = viewMode === 'dues' ? (duesData?.months ?? []) : (paidData?.months ?? [])

  function toggleSort(col: string) {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: 'desc' }
      if (prev.dir === 'desc') return { col, dir: 'asc' }
      return null
    })
  }

  // Sorted+filtered rows for dues view
  const filteredDues = useMemo(() => {
    if (!duesData?.apartments) return []
    const q = search.toLowerCase()
    let rows = duesData.apartments.filter((a) =>
      !q || a.apartment.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q),
    )
    if (sort) {
      rows = [...rows].sort((a, b) => {
        const av = sort.col === 'total' ? (a.totalDue ?? 0) : (a.collections[sort.col] ?? -1)
        const bv = sort.col === 'total' ? (b.totalDue ?? 0) : (b.collections[sort.col] ?? -1)
        return sort.dir === 'asc' ? av - bv : bv - av
      })
    }
    return rows
  }, [duesData?.apartments, search, sort])

  // Sorted+filtered rows for paid view
  const filteredPaid = useMemo(() => {
    if (!paidData?.apartments) return []
    const q = search.toLowerCase()
    let rows = paidData.apartments.filter((a) =>
      !q || a.apartment.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q),
    )
    if (sort) {
      rows = [...rows].sort((a, b) => {
        const av = sort.col === 'total' ? (a.totalPaid ?? 0) : (a.payments[sort.col] ?? -1)
        const bv = sort.col === 'total' ? (b.totalPaid ?? 0) : (b.payments[sort.col] ?? -1)
        return sort.dir === 'asc' ? av - bv : bv - av
      })
    }
    return rows
  }, [paidData?.apartments, search, sort])

  const filtered     = viewMode === 'dues' ? filteredDues : filteredPaid
  const duesSummary  = duesData?.summary
  const paidSummary  = paidData?.summary

  // Open edit dialog — dues mode: empty input (partial payment)
  function openEditDues(apt: string, owner: string, month: string, dueAmount: number | null) {
    if (!canEdit) return
    setEditCell({ apartment: apt, owner, month, contextAmount: dueAmount, contextLabel: 'Outstanding Due' })
    setEditAmount('')
  }

  // Open edit dialog — paid mode: pre-fill with existing paid amount
  function openEditPaid(apt: string, owner: string, month: string, paidAmount: number | null) {
    if (!canEdit) return
    setEditCell({ apartment: apt, owner, month, contextAmount: paidAmount, contextLabel: 'Previously Paid' })
    setEditAmount(paidAmount !== null && paidAmount > 0 ? String(paidAmount) : '')
  }

  function handleSave() {
    if (!editCell) return
    const amount = parseFloat(editAmount) || 0
    updatePayment.mutate(
      { apartment: editCell.apartment, month: editCell.month, amount },
      { onSuccess: () => setEditCell(null) },
    )
  }

  const thSort = (col: string) => cn(
    'px-2 py-2.5 font-medium whitespace-nowrap cursor-pointer select-none',
    'hover:bg-muted/60 transition-colors',
    sort?.col === col && 'text-primary',
  )

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-semibold">MMC Collection</h1>
        <div className="flex items-center gap-2">
          {/* Dues / Paid toggle */}
          <div className="flex rounded-md border overflow-hidden text-xs font-medium">
            <button
              onClick={() => setViewMode('dues')}
              className={cn(
                'px-3 py-1.5 transition-colors',
                viewMode === 'dues'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              Dues
            </button>
            <button
              onClick={() => setViewMode('paid')}
              className={cn(
                'px-3 py-1.5 border-l transition-colors',
                viewMode === 'paid'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              Paid
            </button>
          </div>

          {/* FY selector */}
          <Select value={fy} onValueChange={(v) => setFy(v as FiscalYear)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FISCAL_YEARS.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Rate Card */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setRateCardOpen(true)}
          >
            <Receipt className="h-3.5 w-3.5" />
            Rate Card
          </Button>
        </div>
      </div>

      <MMCRateModal open={rateCardOpen} fy={fy} onClose={() => setRateCardOpen(false)} />

      {/* KPI strip — dues view */}
      {viewMode === 'dues' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5" /> Total Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {duesLoading ? <Skeleton className="h-6 w-24" /> : (
                <p className="text-xl font-bold text-destructive">
                  {formatCurrency(duesSummary?.totalOutstanding ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> Pending This FY
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {duesLoading ? <Skeleton className="h-6 w-24" /> : (
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(duesSummary?.dueThisFY ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5" />
                {duesSummary?.currentMonth ? `${duesSummary.currentMonth} Rate` : 'Current Month'}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {duesLoading ? <Skeleton className="h-6 w-20" /> : (
                <div className="flex items-end gap-2">
                  <p className="text-xl font-bold">{duesSummary?.collectionRateThisMonth ?? 0}%</p>
                  <p className="text-xs text-muted-foreground pb-0.5">
                    {duesSummary?.clearedThisMonth ?? 0}/{duesSummary?.totalApartments ?? 0} cleared
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* KPI strip — paid view */}
      {viewMode === 'paid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5" /> Total Collected
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {paidLoading ? <Skeleton className="h-6 w-24" /> : (
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(paidSummary?.totalCollected ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Collected This FY
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {paidLoading ? <Skeleton className="h-6 w-24" /> : (
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(paidSummary?.collectedThisFY ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5" />
                {paidSummary?.currentMonth ? `${paidSummary.currentMonth} Paid` : 'Current Month'}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {paidLoading ? <Skeleton className="h-6 w-20" /> : (
                <div className="flex items-end gap-2">
                  <p className="text-xl font-bold text-emerald-600">{paidSummary?.paidThisMonth ?? 0}</p>
                  <p className="text-xs text-muted-foreground pb-0.5">
                    of {paidSummary?.totalApartments ?? 0} units paid
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search owner or apt…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            {filtered.length} unit{filtered.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-3 py-2.5 font-medium whitespace-nowrap sticky left-0 bg-muted/40 z-10">Apt</th>
                  <th className="text-left px-3 py-2.5 font-medium whitespace-nowrap">Owner</th>
                  <th className="text-left px-3 py-2.5 font-medium whitespace-nowrap hidden sm:table-cell">Type</th>
                  <th
                    className={cn(thSort('total'), 'text-right')}
                    onClick={() => toggleSort('total')}
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      {viewMode === 'dues' ? 'Total Due' : 'Total Paid'}
                      <SortIcon col="total" sort={sort} />
                    </span>
                  </th>
                  {months.map((m) => (
                    <th
                      key={m}
                      className={cn(thSort(m), 'text-center min-w-[64px]')}
                      onClick={() => toggleSort(m)}
                    >
                      <span className="inline-flex items-center justify-center gap-0.5">
                        {m.split('-')[0]} <SortIcon col={m} sort={sort} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-3 py-2"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))}

                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4 + months.length} className="px-3 py-8 text-center text-muted-foreground">
                      No records found
                    </td>
                  </tr>
                )}

                {/* ── DUES rows ── */}
                {!isLoading && viewMode === 'dues' && (filteredDues as typeof filteredDues).map((apt) => {
                  const hasDue = apt.totalDue > 0
                  return (
                    <tr
                      key={apt.apartment}
                      className={cn('border-b hover:bg-muted/30 transition-colors', hasDue && 'bg-red-50/30')}
                    >
                      <td className="px-3 py-2 font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">
                        {apt.apartment}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap max-w-[140px] truncate">
                        {apt.owner || '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {apt.type || '—'}
                      </td>
                      <td className={cn(
                        'px-3 py-2 text-right font-medium whitespace-nowrap',
                        hasDue ? 'text-destructive' : 'text-muted-foreground',
                      )}>
                        {hasDue ? formatCurrency(apt.totalDue) : '—'}
                      </td>
                      {months.map((m) => {
                        const due        = apt.collections[m]
                        const isFuture   = due === null || due === undefined
                        const isCleared  = !isFuture && due === 0
                        const isDue      = !isFuture && due! > 0
                        return (
                          <td
                            key={m}
                            className={cn('px-1 py-1.5 text-center', canEdit && !isFuture && 'cursor-pointer')}
                            onClick={() => !isFuture && openEditDues(apt.apartment, apt.owner, m, due!)}
                          >
                            <span className={cn(
                              'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium min-w-[72px]',
                              isDue     && 'bg-red-100 text-red-700 hover:bg-red-200',
                              isCleared && 'bg-green-100 text-green-700',
                              isFuture  && 'text-muted-foreground/40',
                            )}>
                              {isDue     ? formatCurrency(due!)
                               : isCleared ? '✓'
                               : canEdit  ? <Pencil className="h-3 w-3 opacity-20" />
                               : '—'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}

                {/* ── PAID rows ── */}
                {!isLoading && viewMode === 'paid' && (filteredPaid as typeof filteredPaid).map((apt) => {
                  const hasPayment = apt.totalPaid > 0
                  return (
                    <tr
                      key={apt.apartment}
                      className={cn('border-b hover:bg-muted/30 transition-colors', hasPayment && 'bg-green-50/30')}
                    >
                      <td className="px-3 py-2 font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">
                        {apt.apartment}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap max-w-[140px] truncate">
                        {apt.owner || '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {apt.type || '—'}
                      </td>
                      <td className={cn(
                        'px-3 py-2 text-right font-medium whitespace-nowrap',
                        hasPayment ? 'text-emerald-600' : 'text-muted-foreground',
                      )}>
                        {hasPayment ? formatCurrency(apt.totalPaid) : '—'}
                      </td>
                      {months.map((m) => {
                        const paid     = apt.payments[m]
                        const isFuture = isMonthFuture(m)
                        const isPaid   = paid !== null && paid !== undefined && paid > 0
                        return (
                          <td
                            key={m}
                            className={cn('px-1 py-1.5 text-center', canEdit && !isFuture && 'cursor-pointer')}
                            onClick={() => !isFuture && openEditPaid(apt.apartment, apt.owner, m, paid ?? null)}
                          >
                            <span className={cn(
                              'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium min-w-[72px]',
                              isPaid    && 'bg-green-100 text-green-700 hover:bg-green-200',
                              !isPaid && !isFuture && 'text-muted-foreground/50',
                              isFuture  && 'text-muted-foreground/25',
                            )}>
                              {isPaid   ? formatCurrency(paid!)
                               : isFuture ? '—'
                               : canEdit  ? <Pencil className="h-3 w-3 opacity-30" />
                               : '—'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment dialog — shared for both views */}
      <Dialog open={!!editCell} onOpenChange={(open) => { if (!open) setEditCell(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {editCell && (
            <div className="space-y-4 px-6 py-2">
              <div className="rounded-md border bg-muted/30 p-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <span className="text-muted-foreground">Apartment</span>
                <span className="font-medium">{editCell.apartment}</span>
                <span className="text-muted-foreground">Owner</span>
                <span className="font-medium">{editCell.owner || '—'}</span>
                <span className="text-muted-foreground">Month</span>
                <span className="font-medium">{editCell.month}</span>
                {editCell.contextAmount !== null && editCell.contextAmount > 0 && (
                  <>
                    <span className="text-muted-foreground">{editCell.contextLabel}</span>
                    <span className={cn(
                      'font-medium',
                      editCell.contextLabel === 'Outstanding Due' ? 'text-destructive' : 'text-emerald-600',
                    )}>
                      {formatCurrency(editCell.contextAmount)}
                    </span>
                  </>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amt">Amount Paid (₹)</Label>
                <Input
                  id="amt"
                  type="number"
                  min={0}
                  placeholder="e.g. 1500"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
              </div>
            </div>
          )}
          <DialogFooter className="px-6 pb-2">
            <Button variant="outline" onClick={() => setEditCell(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updatePayment.isPending}>
              {updatePayment.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
