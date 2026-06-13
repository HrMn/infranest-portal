import { useState, useCallback, useEffect } from 'react'
import { UploadCloud, AlertTriangle, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ParsedStatementRow } from '@/shared/types'
import { parseCsvFile, applyColumnMap } from '@/shared/utils/csvParser'
import type { ColumnMap } from '@/shared/utils/csvParser'
import { parsePdfFile, BANK_FORMAT_OPTIONS } from '@/shared/utils/pdfParser'
import type { BankFormat } from '@/shared/utils/pdfParser'
import { parseExcelFile } from '@/shared/utils/excelParser'
import { ALL_CATEGORIES } from '@/shared/utils/statementUtils'
import { formatCurrency } from '@/shared/utils/formatters'
import { matchApartment } from '@/shared/utils/aptMapper'
import { useImportTransactions } from '../hooks/useTransactions'
import { useAptMapping } from '../hooks/useAptMapping'

interface Props {
  open: boolean
  fy: string
  onClose: () => void
  onImported: (count: number) => void
}

type Step     = 'upload' | 'map' | 'preview'
type FileType = 'csv' | 'excel' | 'pdf'

const PAYMENT_MODES = ['Online', 'Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque']
const MONTH_NAMES   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function detectFileType(filename: string): FileType {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'excel'
  return 'csv'
}

function getFyRange(fy: string): { start: Date; end: Date } | null {
  const m = fy.match(/^FY(\d{2})-(\d{2})$/)
  if (!m) return null
  const sy = 2000 + parseInt(m[1])
  const ey = 2000 + parseInt(m[2])
  return { start: new Date(sy, 3, 1), end: new Date(ey, 2, 31, 23, 59, 59) }
}

function parseDdMmYyyy(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
}

function formatDateDisplay(ddMmYyyy: string): string {
  const m = ddMmYyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ddMmYyyy
  const mon = MONTH_NAMES[parseInt(m[2]) - 1]
  return mon ? `${mon} ${m[1]}, ${m[3]}` : ddMmYyyy
}

function fyRangeLabel(fy: string): string {
  const m = fy.match(/^FY(\d{2})-(\d{2})$/)
  if (!m) return fy
  return `Apr 20${m[1]} – Mar 20${m[2]}`
}

function applyFyFilter(rows: ParsedStatementRow[], fy: string): ParsedStatementRow[] {
  const range = getFyRange(fy)
  if (!range) return rows
  return rows.map((r) => {
    const d = parseDdMmYyyy(r.date)
    const outOfRange = d !== null && (d < range.start || d > range.end)
    return outOfRange ? { ...r, include: false, outOfRange: true } : { ...r, outOfRange: false }
  })
}

// ─── Steps indicator ─────────────────────────────────────────────────────────

function StepsBar({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-1 mb-5">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1">
          <div className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
            i < current  ? 'bg-primary/20 text-primary' :
            i === current ? 'bg-primary text-primary-foreground' :
                            'bg-muted text-muted-foreground',
          )}>
            {i + 1}
          </div>
          <span className={cn('text-xs hidden sm:inline', i === current ? 'text-foreground font-medium' : 'text-muted-foreground')}>
            {label}
          </span>
          {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />}
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportStatementModal({ open, fy, onClose, onImported }: Props) {
  const [step,        setStep]        = useState<Step>('upload')
  const [fileList,    setFileList]    = useState<File[]>([])
  const [fileType,    setFileType]    = useState<FileType>('excel')
  const [bankFormat,  setBankFormat]  = useState<BankFormat>('sbi')
  const [parsing,     setParsing]     = useState(false)
  const [parseError,  setParseError]  = useState('')
  const [csvHeaders,  setCsvHeaders]  = useState<string[]>([])
  const [colMap,      setColMap]      = useState<ColumnMap>({ date: '', particulars: '', debit: '', credit: '', balance: '' })
  const [rawRows,     setRawRows]     = useState<Record<string, unknown>[]>([])
  const [previewRows, setPreviewRows] = useState<ParsedStatementRow[]>([])
  const [dragging,    setDragging]    = useState(false)

  const importMut = useImportTransactions(fy)
  const { data: aptMappingData } = useAptMapping(fy, open)
  const aptMappings = aptMappingData?.mappings ?? []

  useEffect(() => {
    if (!aptMappings.length || !previewRows.length) return
    setPreviewRows((prev) =>
      prev.map((r) => r.apartment ? r : { ...r, apartment: matchApartment(r.particulars, aptMappings) }),
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aptMappings])

  function applyApartments(rows: ParsedStatementRow[]): ParsedStatementRow[] {
    if (!aptMappings.length) return rows
    return rows.map((r) => ({ ...r, apartment: r.apartment || matchApartment(r.particulars, aptMappings) }))
  }

  function resetState() {
    setStep('upload'); setFileList([]); setFileType('excel'); setParsing(false)
    setParseError(''); setCsvHeaders([])
    setColMap({ date: '', particulars: '', debit: '', credit: '', balance: '' })
    setRawRows([]); setPreviewRows([])
  }

  function handleClose() { resetState(); onClose() }

  function pickFile(file: File) {
    setFileList([file])
    setParseError('')
    setFileType(detectFileType(file.name))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) pickFile(file)
  }, [])

  async function handleParse() {
    const file = fileList[0]
    if (!file) return
    setParsing(true); setParseError('')
    try {
      if (fileType === 'pdf') {
        const { rows, parseError: err } = await parsePdfFile(file, bankFormat)
        if (err) { setParseError(err); return }
        setPreviewRows(applyApartments(applyFyFilter(rows, fy)))
        setStep('preview')
      } else if (fileType === 'excel') {
        const { rows, parseError: err } = await parseExcelFile(file)
        if (err) { setParseError(err); return }
        setPreviewRows(applyApartments(applyFyFilter(rows, fy)))
        setStep('preview')
      } else {
        const { headers, suggestedMap, rows } = await parseCsvFile(file)
        setCsvHeaders(headers); setColMap(suggestedMap)
        const Papa = await import('papaparse').then((m) => m.default)
        const result = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
          Papa.parse(file, {
            header: true, skipEmptyLines: true,
            transformHeader: (h) => h.trim(),
            complete: (r) => resolve(r.data as Record<string, unknown>[]),
            error: (e) => reject(new Error(e.message)),
          })
        })
        setRawRows(result)
        setPreviewRows(applyApartments(applyFyFilter(rows, fy)))
        setStep('map')
      }
    } catch (err) {
      setParseError((err as Error).message)
    } finally {
      setParsing(false)
    }
  }

  function handleApplyMap() {
    const rows = applyColumnMap(rawRows, colMap)
    setPreviewRows(applyApartments(applyFyFilter(rows, fy)))
    setStep('preview')
  }

  function toggleRow(idx: number, checked: boolean) {
    setPreviewRows((prev) => prev.map((r, i) => (i === idx ? { ...r, include: checked } : r)))
  }

  function updateRow(idx: number, field: keyof ParsedStatementRow, value: unknown) {
    setPreviewRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  async function handleImport() {
    const selected = previewRows.filter((r) => r.include)
    if (!selected.length) return
    try {
      const result = await importMut.mutateAsync(selected)
      onImported(result.imported)
    } catch {
      setParseError('Import failed. Please try again.')
    }
  }

  const selectedCount   = previewRows.filter((r) => r.include).length
  const outOfRangeCount = previewRows.filter((r) => r.outOfRange).length
  const selectedIncome  = previewRows.filter((r) => r.include && r.income).reduce((s, r) => s + (r.income ?? 0), 0)
  const selectedExpense = previewRows.filter((r) => r.include && r.expenditure).reduce((s, r) => s + (r.expenditure ?? 0), 0)

  const steps    = ['Upload', fileType === 'csv' ? 'Map Columns' : 'Parsed', 'Preview']
  const stepIdx  = step === 'upload' ? 0 : step === 'map' ? 1 : 2

  const headerOptions = ['', ...csvHeaders]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className={cn('max-h-[90vh] flex flex-col', step === 'preview' ? 'max-w-5xl' : 'max-w-lg')}>
        <DialogHeader>
          <DialogTitle>Import Bank Statement</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <StepsBar current={stepIdx} steps={steps} />

          {parseError && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="flex-1">{parseError}</span>
              <button onClick={() => setParseError('')}><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors',
                  dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50',
                )}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept=".csv,.xls,.xlsx,.pdf"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
                />
                <UploadCloud className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                <p className="text-sm font-medium">Click or drag a file here</p>
                <p className="text-xs text-muted-foreground mt-1">Excel (.xls / .xlsx) · CSV · PDF · Max 5 MB</p>
              </div>

              {fileList[0] && (
                <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <span className="text-sm truncate max-w-xs">{fileList[0].name}</span>
                  <button onClick={() => setFileList([])} className="text-muted-foreground hover:text-foreground ml-2">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {fileType === 'pdf' && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Bank format:</span>
                  <Select value={bankFormat} onValueChange={(v) => setBankFormat(v as BankFormat)}>
                    <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BANK_FORMAT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {parsing && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Parsing file…
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Map Columns (CSV only) ── */}
          {step === 'map' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{csvHeaders.length} columns detected. Confirm the mapping below.</p>
              {([
                ['date',        'Date *'],
                ['particulars', 'Particulars *'],
                ['debit',       'Expenditure (Debit)'],
                ['credit',      'Income (Credit)'],
                ['balance',     'Balance (optional)'],
              ] as [keyof ColumnMap, string][]).map(([field, label]) => (
                <div key={field} className="grid grid-cols-2 items-center gap-3">
                  <span className="text-sm">{label}</span>
                  <Select value={colMap[field]} onValueChange={(v) => setColMap((m) => ({ ...m, [field]: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="— not mapped —" /></SelectTrigger>
                    <SelectContent>
                      {headerOptions.map((h) => (
                        <SelectItem key={h} value={h} className="text-xs">{h || '— not mapped —'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{previewRows.length} transaction rows detected.</p>
            </div>
          )}

          {/* ── Step 3: Preview ── */}
          {step === 'preview' && (
            <div className="space-y-3">
              {outOfRangeCount > 0 && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {outOfRangeCount} transaction{outOfRangeCount !== 1 ? 's have' : ' has'} dates outside {fy} ({fyRangeLabel(fy)}) and {outOfRangeCount !== 1 ? 'have' : 'has'} been excluded. You can still re-check them.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span><strong className="text-foreground">{selectedCount}</strong> of {previewRows.length} selected</span>
                <span>Income: <strong className="text-emerald-600">{formatCurrency(selectedIncome)}</strong></span>
                <span>Expense: <strong className="text-red-600">{formatCurrency(selectedExpense)}</strong></span>
              </div>

              <div className="overflow-auto max-h-[50vh] rounded-md border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr className="border-b">
                      <th className="w-8 px-2 py-2"></th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground w-24">Date</th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[200px]">Particulars</th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground w-16">Apt</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground w-24">Expense</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground w-24">Income</th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground w-36">Category</th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground w-24">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewRows.map((r, i) => (
                      <tr
                        key={i}
                        className={cn(
                          'transition-colors',
                          r.outOfRange ? 'bg-amber-50/50' : '',
                          !r.include && !r.outOfRange ? 'opacity-40' : '',
                        )}
                      >
                        <td className="px-2 py-1.5 text-center">
                          <Checkbox
                            checked={r.include}
                            onCheckedChange={(c) => toggleRow(i, !!c)}
                            className="h-3.5 w-3.5"
                          />
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground">
                          {r.outOfRange && <AlertTriangle className="inline h-3 w-3 text-amber-500 mr-1" />}
                          {formatDateDisplay(r.date)}
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            className="w-full bg-transparent border-0 outline-none focus:bg-muted/50 rounded px-1 -mx-1"
                            value={r.particulars}
                            onChange={(e) => updateRow(i, 'particulars', e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            className="w-14 bg-transparent border-0 outline-none focus:bg-muted/50 rounded px-1 -mx-1 text-center"
                            value={r.apartment}
                            onChange={(e) => updateRow(i, 'apartment', e.target.value)}
                            placeholder="—"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <input
                            type="number"
                            className="w-24 bg-transparent border-0 outline-none focus:bg-muted/50 rounded px-1 text-right text-red-600"
                            value={r.expenditure ?? ''}
                            onChange={(e) => updateRow(i, 'expenditure', e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <input
                            type="number"
                            className="w-24 bg-transparent border-0 outline-none focus:bg-muted/50 rounded px-1 text-right text-emerald-600"
                            value={r.income ?? ''}
                            onChange={(e) => updateRow(i, 'income', e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Select value={r.category} onValueChange={(v) => updateRow(i, 'category', v)}>
                            <SelectTrigger className="h-6 text-xs border-0 bg-transparent px-1 focus:bg-muted/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5">
                          <Select value={r.paymentMode} onValueChange={(v) => updateRow(i, 'paymentMode', v)}>
                            <SelectTrigger className="h-6 text-xs border-0 bg-transparent px-1 focus:bg-muted/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PAYMENT_MODES.map((m) => (
                                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step !== 'upload' && (
            <Button variant="outline" size="sm" onClick={() => setStep(step === 'preview' && fileType === 'csv' ? 'map' : 'upload')}>
              Back
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>

          {step === 'upload' && (
            <Button size="sm" onClick={handleParse} disabled={!fileList.length || parsing}>
              {parsing ? (
                <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />Parsing…</>
              ) : 'Parse File'}
            </Button>
          )}
          {step === 'map' && (
            <Button size="sm" onClick={handleApplyMap}>Preview Transactions</Button>
          )}
          {step === 'preview' && (
            <Button size="sm" onClick={handleImport} disabled={selectedCount === 0 || importMut.isPending}>
              {importMut.isPending
                ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />Importing…</>
                : `Import ${selectedCount} Transaction${selectedCount !== 1 ? 's' : ''}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
