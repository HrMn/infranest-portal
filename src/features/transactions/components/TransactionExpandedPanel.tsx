import { useState } from 'react'
import { Pencil, Trash2, Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Transaction } from '@/shared/types'
import { useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions'

const PAYMENT_MODES = ['Cash', 'Online', 'UPI', 'NEFT', 'RTGS', 'Cheque']
const STATUS_OPTIONS = ['Pending Verification', 'Verified']

interface Props {
  txn: Transaction
  fy: string
  isWriter: boolean
  categories: string[]
  onClose: () => void
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
      <p className="text-xs font-medium mt-1">{value || '—'}</p>
    </div>
  )
}

function initForm(txn: Transaction) {
  return {
    date:        txn.date,
    particulars: txn.particulars,
    expenditure: txn.expenditure != null ? txn.expenditure.toString() : '',
    income:      txn.income      != null ? txn.income.toString()      : '',
    paymentMode: txn.paymentMode || '',
    paymentType: txn.paymentType || '',
    apartment:   txn.apartment   || '',
    receiptNo:   txn.receiptNo   || '',
    voucherNo:   txn.voucherNo   || '',
    remarks:     txn.remarks     || '',
    status:      txn.status      || 'Done',
  }
}

export function TransactionExpandedPanel({ txn, fy, isWriter, categories, onClose }: Props) {
  const update = useUpdateTransaction(fy)
  const remove = useDeleteTransaction(fy)

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(() => initForm(txn))

  // Always include the current paymentType even if it's not in the active categories list
  const categoryOpts = [...new Set([...categories, txn.paymentType].filter(Boolean))]

  const set = (k: keyof typeof form) => (v: string) => setForm((p) => ({ ...p, [k]: v }))

  function handleCancel() {
    setForm(initForm(txn))
    setIsEditing(false)
  }

  async function handleSave() {
    await update.mutateAsync({
      rowIndex:    txn.rowIndex,
      date:        form.date.trim(),
      particulars: form.particulars.trim(),
      expenditure: form.expenditure ? parseFloat(form.expenditure) : null,
      income:      form.income      ? parseFloat(form.income)      : null,
      paymentMode: form.paymentMode,
      paymentType: form.paymentType,
      apartment:   form.apartment.trim(),
      receiptNo:   form.receiptNo.trim(),
      voucherNo:   form.voucherNo.trim(),
      remarks:     form.remarks.trim(),
      status:      form.status,
    })
    setIsEditing(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this transaction? This cannot be undone.')) return
    await remove.mutateAsync(txn.rowIndex)
    onClose()
  }

  if (isEditing) {
    return (
      <div className="px-4 py-4 bg-primary/5 border-t border-dashed border-primary/20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          <div className="space-y-1">
            <Label className="text-[11px]">Date (DD/MM/YYYY)</Label>
            <Input
              className="h-7 text-xs"
              value={form.date}
              onChange={(e) => set('date')(e.target.value)}
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-[11px]">Particulars</Label>
            <Input
              className="h-7 text-xs"
              value={form.particulars}
              onChange={(e) => set('particulars')(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Category</Label>
            <Select value={form.paymentType} onValueChange={set('paymentType')}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {categoryOpts.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Income</Label>
            <Input
              className="h-7 text-xs"
              type="number"
              min="0"
              value={form.income}
              onChange={(e) => set('income')(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Expense</Label>
            <Input
              className="h-7 text-xs"
              type="number"
              min="0"
              value={form.expenditure}
              onChange={(e) => set('expenditure')(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Payment Mode</Label>
            <Select value={form.paymentMode} onValueChange={set('paymentMode')}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Apartment</Label>
            <Input
              className="h-7 text-xs"
              value={form.apartment}
              onChange={(e) => set('apartment')(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Receipt No</Label>
            <Input
              className="h-7 text-xs"
              value={form.receiptNo}
              onChange={(e) => set('receiptNo')(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Voucher No</Label>
            <Input
              className="h-7 text-xs"
              value={form.voucherNo}
              onChange={(e) => set('voucherNo')(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Status</Label>
            <Select value={form.status} onValueChange={set('status')}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-[11px]">Remarks</Label>
            <Input
              className="h-7 text-xs"
              value={form.remarks}
              onChange={(e) => set('remarks')(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleSave}
            disabled={update.isPending}
          >
            {update.isPending
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Save className="h-3 w-3" />}
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={handleCancel}
            disabled={update.isPending}
          >
            <X className="h-3 w-3" /> Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-muted/20 border-t border-dashed flex items-start justify-between gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3">
        <DetailField label="Apartment"  value={txn.apartment} />
        <DetailField label="Voucher No" value={txn.voucherNo} />
        <DetailField label="Receipt No" value={txn.receiptNo} />
        <DetailField label="Remarks"    value={txn.remarks} />
        {txn.status && <DetailField label="Status" value={txn.status} />}
        {txn.source && <DetailField label="Source" value={txn.source} />}
      </div>
      {isWriter && (
        <div className="flex gap-1 shrink-0 pt-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3 w-3" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-destructive/80 hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={remove.isPending}
          >
            {remove.isPending
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Trash2 className="h-3 w-3" />}
            Delete
          </Button>
        </div>
      )}
    </div>
  )
}
