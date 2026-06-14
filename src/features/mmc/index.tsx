import { useState, useMemo } from 'react'
import { Search, Pencil, IndianRupee, CalendarCheck, AlertCircle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup } from '@/components/ui/toggle-group'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useMMCStatus, useUpdateMMCPayment } from './hooks/useMMC'
import { useAppStore } from '@/shared/store/appStore'
import { usePermission } from '@/shared/hooks/usePermission'
import { formatCurrency } from '@/shared/utils/formatters'
import { FISCAL_YEARS, type FiscalYear } from '@/shared/utils/constants'
import { cn } from '@/lib/utils'

interface EditCell {
  apartment: string
  owner: string
  month: string
  dueAmount: number | null
}

type SortDir = 'asc' | 'desc'
interface SortState { col: string; dir: SortDir }

function compact(amount: number): string {
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`
  return `₹${amount}`
}

function SortIcon({ col, sort }: { col: string; sort: SortState | null }) {
  if (!sort || sort.col !== col) return <ChevronsUpDown className="h-3 w-3 opacity-40" />
  return sort.dir === 'asc'
    ? <ChevronUp className="h-3 w-3" />
    : <ChevronDown className="h-3 w-3" />
}

const FY_OPTIONS = FISCAL_YEARS.map((fy) => ({ value: fy, label: fy }))

export function MMCPage() {
  const globalFY = useAppStore((s) => s.selectedFY)
  const canEdit  = usePermission('verify:transaction')

  const [fy, setFy] = useState<FiscalYear>(globalFY)

  const { data, isLoading }  = useMMCStatus(fy)
  const updatePayment        = useUpdateMMCPayment(fy)

  const [search, setSearch]         = useState('')
  const [sort, setSort]             = useState<SortState | null>(null)
  const [editCell, setEditCell]     = useState<EditCell | null>(null)
  const [editAmount, setEditAmount] = useState('')

  const months  = data?.months ?? []
  const summary = data?.summary

  function toggleSort(col: string) {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: 'desc' }
      if (prev.dir === 'desc') return { col, dir: 'asc' }
      return null  // third click clears sort
    })
  }

  const filtered = useMemo(() => {
    if (!data?.apartments) return []
    const q = search.toLowerCase()
    let rows = data.apartments.filter((a) => {
      if (q && !a.apartment.toLowerCase().includes(q) && !a.owner.toLowerCase().includes(q)) return false
      return true
    })

    if (sort) {
      rows = [...rows].sort((a, b) => {
        let av: number, bv: number
        if (sort.col === 'totalDue') {
          av = a.totalDue ?? 0
          bv = b.totalDue ?? 0
        } else {
          av = a.collections[sort.col] ?? -1  // null (future) sorts lowest
          bv = b.collections[sort.col] ?? -1
        }
        return sort.dir === 'asc' ? av - bv : bv - av
      })
    }

    return rows
  }, [data?.apartments, search, sort])

  function openEdit(apt: string, owner: string, month: string, dueAmount: number | null) {
    if (!canEdit) return
    setEditCell({ apartment: apt, owner, month, dueAmount })
    setEditAmount('')
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
        <ToggleGroup
          options={FY_OPTIONS}
          value={fy}
          onChange={(v) => setFy(v as FiscalYear)}
        />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5" /> Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-xl font-bold text-destructive">
                {formatCurrency(summary?.totalOutstanding ?? 0)}
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
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(summary?.dueThisFY ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5" />
              {summary?.currentMonth ? `${summary.currentMonth} Rate` : 'Current Month'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="flex items-end gap-2">
                <p className="text-xl font-bold">{summary?.collectionRateThisMonth ?? 0}%</p>
                <p className="text-xs text-muted-foreground pb-0.5">
                  {summary?.clearedThisMonth ?? 0}/{summary?.totalApartments ?? 0} cleared
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                    className={cn(thSort('totalDue'), 'text-right')}
                    onClick={() => toggleSort('totalDue')}
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      Total Due <SortIcon col="totalDue" sort={sort} />
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
                {isLoading &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j} className="px-3 py-2">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                }
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4 + months.length} className="px-3 py-8 text-center text-muted-foreground">
                      No records found
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.map((apt) => {
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
                        const due = apt.collections[m]
                        const isFuture  = due === null || due === undefined
                        const isCleared = !isFuture && due === 0
                        const isDue     = !isFuture && due! > 0

                        return (
                          <td
                            key={m}
                            className={cn('px-1 py-1.5 text-center', canEdit && !isFuture && 'cursor-pointer')}
                            onClick={() => !isFuture && openEdit(apt.apartment, apt.owner, m, due!)}
                          >
                            <span className={cn(
                              'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium min-w-[52px]',
                              isDue     && 'bg-red-100 text-red-700 hover:bg-red-200',
                              isCleared && 'bg-green-100 text-green-700',
                              isFuture  && 'text-muted-foreground/40',
                            )}>
                              {isDue     ? compact(due!)
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
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment dialog */}
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
                {editCell.dueAmount !== null && editCell.dueAmount > 0 && (
                  <>
                    <span className="text-muted-foreground">Due Amount</span>
                    <span className="font-medium text-destructive">{formatCurrency(editCell.dueAmount)}</span>
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
