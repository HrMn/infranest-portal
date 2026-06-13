import { ParsedStatementRow } from '@/shared/types'
import { guessCategory } from './statementUtils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// sheet_to_json is called with raw:false + dateNF:'DD/MM/YYYY', so SheetJS
// formats date cells as "DD/MM/YYYY" strings directly — no Date objects, no
// timezone conversion needed here.  We only need to normalise the separators.
function excelDateToString(cell: unknown): string {
  if (!cell) return ''
  const s = String(cell).trim()
  // Accept DD/MM/YYYY or DD-MM-YYYY (SheetJS respects dateNF, but be safe)
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}`
  return s
}

function parseNum(cell: unknown): number | null {
  if (cell === null || cell === undefined || cell === '') return null
  // raw:false means numbers arrive as formatted strings; strip commas/spaces
  const n = typeof cell === 'number' ? cell : parseFloat(String(cell).replace(/[,\s]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}

// ─── Description cleaner (same rules as PDF parser) ──────────────────────────

function cleanSbiDescription(description: string): string {
  return description
    .replace(/^BY TRANSFER[-–]?\s*/i, '')
    .replace(/^TO CLEARING[-–]?\s*/i, '')
    .replace(/^CHEQUE WDL[-–]?\s*/i, '')
    .replace(/^CHEQUE TRANSFER TO[-–]?\s*/i, 'TRANSFER TO ')
    .replace(/^CHQ RET CHARGES[-–]?\s*/i, 'Cheque Return ')
    .replace(/^CAS CORR\s*/i, 'Chq Correction ')
    .replace(/\s*TRANSFER FROM\s+.+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export async function parseExcelFile(
  file: File,
): Promise<{ rows: ParsedStatementRow[]; parseError?: string }> {
  try {
    const XLSX = await import('xlsx')
    const arrayBuffer = await file.arrayBuffer()

    // Do NOT use cellDates:true — it creates JS Date objects that are
    // timezone-sensitive and can produce wrong day/month values in IST.
    // Instead, let sheet_to_json format everything as strings via dateNF.
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheet    = workbook.Sheets[workbook.SheetNames[0]]

    // raw:false  → all cell values returned as formatted strings
    // dateNF     → date cells specifically formatted as DD/MM/YYYY
    // defval:''  → empty cells return '' instead of undefined
    const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header:  1,
      defval:  '',
      raw:     false,
      dateNF:  'DD/MM/YYYY',
    })

    // Locate the header row: SBI Excel has ~19 metadata rows before the
    // column header row that contains "Txn Date".
    let headerIdx = -1
    for (let i = 0; i < raw.length; i++) {
      const row = raw[i] as unknown[]
      if (row.some((c) => /txn.?date/i.test(String(c).trim()))) {
        headerIdx = i
        break
      }
    }

    if (headerIdx === -1) {
      return {
        rows: [],
        parseError:
          'Could not find the transaction header row (expected a "Txn Date" column). ' +
          'Please verify this is an SBI account statement in Excel format.',
      }
    }

    const headers = (raw[headerIdx] as unknown[]).map((c) => String(c).trim())

    const col = (patterns: RegExp[]): number =>
      headers.findIndex((h) => patterns.some((p) => p.test(h)))

    const cols = {
      date:        col([/txn.?date/i, /^date$/i, /trans.*date/i]),
      description: col([/description/i, /narration/i, /particulars/i, /details/i]),
      refNo:       col([/ref.?no/i, /cheque.?no/i, /chq.?no/i]),
      debit:       col([/^debit$/i, /withdrawal/i, /\bdr\b/i]),
      credit:      col([/^credit$/i, /deposit/i, /\bcr\b/i]),
      balance:     col([/^balance$/i, /closing/i]),
    }

    if (cols.date === -1) {
      return {
        rows: [],
        parseError: 'Date column not found. Please check the Excel file.',
      }
    }

    const rows: ParsedStatementRow[] = []

    for (let i = headerIdx + 1; i < raw.length; i++) {
      const row = raw[i] as unknown[]

      const dateStr = excelDateToString(row[cols.date])
      if (!dateStr) continue  // blank row

      const debit  = parseNum(cols.debit  >= 0 ? row[cols.debit]  : null)
      const credit = parseNum(cols.credit >= 0 ? row[cols.credit] : null)
      if (!debit && !credit) continue  // opening/closing balance rows or truly blank

      const description = String(row[cols.description] ?? '').trim()
      const refNo       = cols.refNo >= 0 ? String(row[cols.refNo] ?? '').trim() : ''
      const balance     = parseNum(cols.balance >= 0 ? row[cols.balance] : null)

      const isCredit    = credit !== null
      const cleanedDesc = cleanSbiDescription(description) || description

      // Include Ref No. only when meaningful (not blank, not just "TRANSFER",
      // and not already present in the description)
      const refIsUseful =
        refNo.length > 0 &&
        !/^transfer$/i.test(refNo) &&
        !description.includes(refNo)

      const particulars = refIsUseful ? `${cleanedDesc} [${refNo}]` : cleanedDesc

      rows.push({
        date:        dateStr,
        particulars,
        expenditure: debit,
        income:      credit,
        balance,
        paymentMode: 'Online',
        category:    guessCategory(particulars, isCredit),
        apartment:   '',
        include:     true,
      })
    }

    return rows.length > 0
      ? { rows }
      : {
          rows: [],
          parseError:
            'No transactions found in the Excel file. ' +
            'The file may not have transaction data or the format is unexpected.',
        }
  } catch (err) {
    return {
      rows: [],
      parseError: `Excel parsing failed: ${(err as Error).message}`,
    }
  }
}
