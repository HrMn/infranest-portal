import Papa from 'papaparse'
import { ParsedStatementRow } from '@/shared/types'
import { guessCategory } from './statementUtils'

export interface ColumnMap {
  date: string
  particulars: string
  debit: string
  credit: string
  balance: string
}

export interface CsvParseResult {
  headers: string[]
  suggestedMap: ColumnMap
  rows: ParsedStatementRow[]
}

// Auto-detect which CSV header maps to which field
export function detectColumnMap(headers: string[]): ColumnMap {
  const find = (patterns: RegExp[]): string => {
    for (const h of headers) {
      if (patterns.some((p) => p.test(h))) return h
    }
    return ''
  }
  return {
    date:        find([/^date/i, /^dt$/i, /txn.?date/i, /value.?date/i, /trans.*date/i]),
    particulars: find([/narration/i, /description/i, /particulars/i, /remarks/i, /details/i]),
    debit:       find([/debit/i, /withdrawal/i, /\bdr\b/i, /amount.*dr/i, /charges/i]),
    credit:      find([/credit/i, /deposit/i, /\bcr\b/i, /amount.*cr/i]),
    balance:     find([/balance/i, /closing/i, /avail/i]),
  }
}

function parseAmount(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = parseFloat(String(val).replace(/[,\s]/g, ''))
  return isNaN(n) ? null : n
}

function parseDate(val: unknown): string {
  if (!val) return ''
  const s = String(val).trim()
  // DD/MM/YYYY or DD-MM-YYYY
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m1) return `${m1[1].padStart(2, '0')}/${m1[2].padStart(2, '0')}/${m1[3]}`
  // YYYY-MM-DD (ISO)
  const m2 = s.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (m2) return `${m2[3]}/${m2[2]}/${m2[1]}`
  return s
}

export function applyColumnMap(
  rawRows: Record<string, unknown>[],
  map: ColumnMap,
): ParsedStatementRow[] {
  return rawRows
    .map((raw) => {
      const particulars = String(raw[map.particulars] || '').trim()
      const debit       = parseAmount(raw[map.debit])
      const credit      = parseAmount(raw[map.credit])
      const balance     = parseAmount(raw[map.balance])
      const date        = parseDate(raw[map.date])

      // Skip rows that have no financial data
      if (!date && debit === null && credit === null) return null

      const row: ParsedStatementRow = {
        date,
        particulars,
        expenditure: debit,
        income:      credit,
        balance,
        paymentMode: 'Online',
        category:    guessCategory(particulars, credit !== null && credit > 0),
        apartment:   '',
        include:     true,
      }
      return row
    })
    .filter((r): r is ParsedStatementRow => r !== null)
}

export async function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header:       true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const headers      = result.meta.fields ?? []
        const suggestedMap = detectColumnMap(headers)
        const rows         = applyColumnMap(result.data, suggestedMap)
        resolve({ headers, suggestedMap, rows })
      },
      error: (err) => reject(new Error(err.message)),
    })
  })
}
