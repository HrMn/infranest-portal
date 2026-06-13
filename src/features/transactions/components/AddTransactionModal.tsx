import { useState, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useConfigData } from '@/features/config/hooks/useConfig'
import { useCreateTransactionDynamic } from '../hooks/useTransactions'
import { FISCAL_YEARS, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/shared/utils/constants'
import { dateToFY, todayDDMMYYYY } from '@/shared/utils/fyUtils'

const PAYMENT_MODES      = ['Online', 'Cash']
const STATUS_OPTIONS     = ['Pending Verification', 'Verified']
const DEFAULT_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

type TxnType = 'expense' | 'income'

const EMPTY_FORM = () => ({
  date:        todayDDMMYYYY(),
  particulars: '',
  amount:      '',
  paymentMode: 'Cash',
  paymentType: '',
  apartment:   '',
  receiptNo:   '',
  voucherNo:   '',
  remarks:     '',
  status:      'Pending Verification',
})

interface Props {
  open:      boolean
  currentFY: string
  onClose:   () => void
}

export function AddTransactionModal({ open, currentFY, onClose }: Props) {
  const create = useCreateTransactionDynamic()

  const [form,    setForm]    = useState(EMPTY_FORM)
  const [txnType, setTxnType] = useState<TxnType>('expense')
  const [error,   setError]   = useState('')

  const targetFY    = useMemo(() => dateToFY(form.date), [form.date])
  const isSupported = targetFY !== null && (FISCAL_YEARS as readonly string[]).includes(targetFY)
  const isMismatch  = isSupported && targetFY !== currentFY

  const { data: configData } = useConfigData(targetFY ?? currentFY, 'CATEGORY')
  const categoryOpts = useMemo(() => {
    const configured = (configData?.items ?? []).filter((i) => i.status === 'Active').map((i) => i.key)
    return configured.length > 0 ? configured : DEFAULT_CATEGORIES
  }, [configData])

  const set = (k: keyof ReturnType<typeof EMPTY_FORM>) => (v: string) => {
    setForm((p) => ({ ...p, [k]: v }))
    setError('')
  }

  function handleClose() {
    setForm(EMPTY_FORM())
    setTxnType('expense')
    setError('')
    onClose()
  }

  async function handleSave() {
    if (!form.date.trim()) { setError('Date is required'); return }
    if (!targetFY)         { setError('Enter a valid date in DD/MM/YYYY format'); return }
    if (!isSupported)      { setError(`Financial year ${targetFY} is not configured. Supported: ${FISCAL_YEARS.join(', ')}.`); return }
    if (!form.particulars.trim()) { setError('Particulars is required'); return }
    if (!form.amount)      { setError('Amount is required'); return }

    const amountVal = parseFloat(form.amount)
    if (isNaN(amountVal) || amountVal <= 0) { setError('Enter a valid amount'); return }

    await create.mutateAsync({
      fy:          targetFY,
      date:        form.date.trim(),
      particulars: form.particulars.trim(),
      income:      txnType === 'income'  ? amountVal : null,
      expenditure: txnType === 'expense' ? amountVal : null,
      paymentMode: form.paymentMode,
      paymentType: form.paymentType,
      apartment:   form.apartment.trim(),
      receiptNo:   form.receiptNo.trim(),
      voucherNo:   form.voucherNo.trim(),
      remarks:     form.remarks.trim(),
      status:      form.status,
    })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">

          {/* Date + live FY badge */}
          <div className="flex gap-3 items-end">
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs">Date <span className="text-destructive">*</span></Label>
              <Input
                className="h-8 text-xs"
                value={form.date}
                onChange={(e) => set('date')(e.target.value)}
                placeholder="DD/MM/YYYY"
                autoFocus
              />
            </div>
            {targetFY && (
              <div className="pb-1 shrink-0">
                {isSupported ? (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    isMismatch
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  }`}>
                    → {targetFY}{isMismatch && ' ⚠'}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                    {targetFY} — not configured
                  </span>
                )}
              </div>
            )}
          </div>

          {isMismatch && (
            <p className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              This date falls in <strong>{targetFY}</strong>. The record will be saved to that financial year, not the currently selected <strong>{currentFY}</strong>.
            </p>
          )}

          {/* Particulars */}
          <div className="space-y-1.5">
            <Label className="text-xs">Particulars <span className="text-destructive">*</span></Label>
            <Input
              className="h-8 text-xs"
              value={form.particulars}
              onChange={(e) => set('particulars')(e.target.value)}
              placeholder="Transaction description"
            />
          </div>

          {/* Amount with Expense / Income toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Amount <span className="text-destructive">*</span></Label>
              <div className="flex rounded-md border overflow-hidden text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setTxnType('expense'); setError('') }}
                  className={`px-3 py-1 transition-colors ${
                    txnType === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => { setTxnType('income'); setError('') }}
                  className={`px-3 py-1 border-l transition-colors ${
                    txnType === 'income'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>
            <Input
              className={`h-8 text-xs ${
                txnType === 'expense' ? 'focus-visible:ring-red-400' : 'focus-visible:ring-emerald-400'
              }`}
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => set('amount')(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Category + Mode toggle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={form.paymentType} onValueChange={set('paymentType')}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOpts.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Mode</Label>
              <div className="flex h-8 rounded-md border overflow-hidden text-xs font-medium">
                {PAYMENT_MODES.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set('paymentMode')(m)}
                    className={`flex-1 transition-colors ${i > 0 ? 'border-l' : ''} ${
                      form.paymentMode === m
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Apartment (income only) + Status */}
          <div className="grid grid-cols-2 gap-3">
            {txnType === 'income' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Apartment</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.apartment}
                  onChange={(e) => set('apartment')(e.target.value)}
                  placeholder="e.g. 1A"
                />
              </div>
            )}
            <div className={`space-y-1.5 ${txnType !== 'income' ? 'col-span-2 max-w-[50%]' : ''}`}>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={set('status')}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Receipt No + Voucher No */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Receipt No</Label>
              <Input
                className="h-8 text-xs"
                value={form.receiptNo}
                onChange={(e) => set('receiptNo')(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Voucher No</Label>
              <Input
                className="h-8 text-xs"
                value={form.voucherNo}
                onChange={(e) => set('voucherNo')(e.target.value)}
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label className="text-xs">Remarks</Label>
            <Input
              className="h-8 text-xs"
              value={form.remarks}
              onChange={(e) => set('remarks')(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={create.isPending || (!!targetFY && !isSupported)}
          >
            {create.isPending
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving…</>
              : 'Save Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
