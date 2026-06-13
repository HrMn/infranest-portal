import { ParsedStatementRow } from '@/shared/types'
import { guessCategory } from './statementUtils'

export type BankFormat = 'hdfc' | 'icici' | 'sbi' | 'axis' | 'generic'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function parseAmount(s: string | undefined): number | null {
  if (!s || s.trim() === '') return null
  const n = parseFloat(s.replace(/,/g, ''))
  return isNaN(n) || n === 0 ? null : n
}

function normDate(s: string): string {
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m1) return `${m1[1].padStart(2, '0')}/${m1[2].padStart(2, '0')}/${m1[3]}`
  const m2 = s.match(/^(\d{2}) (\w{3}) (\d{4})$/)
  if (m2) {
    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
    }
    return `${m2[1]}/${months[m2[2]] ?? '01'}/${m2[3]}`
  }
  return s
}

// ─── SBI coordinate-based parser ─────────────────────────────────────────────
//
// SBI account statements have columns:
//   Txn Date | Value Date | Description | Ref No./Cheque No. | Branch Code | Debit | Credit | Balance
//
// Date format: DD/MM/YYYY   Amount format: Indian comma notation (e.g. 2,86,397.91)
//
// Because the Description column wraps across multiple visual lines in the PDF,
// we reconstruct visual rows by grouping text items with the same y-coordinate,
// then accumulate all lines belonging to each transaction before parsing amounts.

function parseSbiTxnText(text: string): ParsedStatementRow | null {
  const dateMatch = text.match(/^(\d{2}\/\d{2}\/\d{4})/)
  if (!dateMatch) return null

  const date = dateMatch[1]
  // Strip Txn Date + optional Value Date
  let rest = text.slice(date.length).trim().replace(/^\d{2}\/\d{2}\/\d{4}\s*/, '')

  // Collect all Indian-format amounts in the text
  const amounts: Array<{ val: number; idx: number }> = []
  const amtRe = /([\d,]+\.\d{2})/g
  let m: RegExpExecArray | null
  while ((m = amtRe.exec(rest)) !== null) {
    const val = parseFloat(m[1].replace(/,/g, ''))
    if (val > 0) amounts.push({ val, idx: m.index })
  }
  if (amounts.length < 2) return null

  // Last amount = closing balance; second-to-last = the debit or credit amount
  const balance   = amounts[amounts.length - 1].val
  const txnAmount = amounts[amounts.length - 2].val

  // Description = text before the first amount, minus the account-reference suffix
  const description = rest.slice(0, amounts[0].idx)
    .replace(/\s*TRANSFER FROM\s+.+$/, '') // strip "TRANSFER FROM acct / branch_code"
    .replace(/\s+/g, ' ')
    .trim()

  // Credits: "BY TRANSFER …", "DEPOSIT TRANSFER", "CAS CORR" (cheque correction reversal)
  const isCredit = /^BY\b|^DEPOSIT\b|^CAS CORR/i.test(description)

  // Strip direction prefix to produce a cleaner particulars string
  const particulars = description
    .replace(/^BY TRANSFER[-–]?\s*/i, '')
    .replace(/^TO CLEARING[-–]?\s*/i, '')
    .replace(/^CHEQUE WDL[-–]?\s*/i, '')
    .replace(/^CHEQUE TRANSFER TO[-–]?\s*/i, 'TRANSFER TO ')
    .replace(/^CHQ RET CHARGES[-–]?\s*/i, 'Cheque Return ')
    .replace(/^CAS CORR\s*/i, 'Chq Correction ')
    .replace(/\s+/g, ' ')
    .trim() || description

  return {
    date,
    particulars,
    expenditure: isCredit ? null : txnAmount,
    income:      isCredit ? txnAmount : null,
    balance,
    paymentMode: 'Online',
    category:    guessCategory(particulars, isCredit),
    apartment:   '',
    include:     true,
  }
}

async function parseSbiStatement(
  file: File,
): Promise<{ rows: ParsedStatementRow[]; parseError?: string }> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const rows: ParsedStatementRow[] = []
  const DATE_RE = /^\d{2}\/\d{2}\/\d{4}/

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page    = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    // Collect every non-empty text item with its x,y position
    const items: Array<{ str: string; x: number; y: number }> = []
    for (const item of content.items) {
      if (!('str' in item)) continue
      const i = item as { str: string; transform: number[] }
      const s = i.str.trim()
      if (s) items.push({ str: s, x: i.transform[4], y: i.transform[5] })
    }

    // Group items onto the same visual line using rounded y-coordinate.
    // PDF y-axis increases upward; items on the same text baseline share
    // the same y value (within ~0.5 units), so Math.round is sufficient.
    const yMap = new Map<number, typeof items>()
    for (const item of items) {
      const key = Math.round(item.y)
      if (!yMap.has(key)) yMap.set(key, [])
      yMap.get(key)!.push(item)
    }

    // Sort lines top-to-bottom (descending y in PDF coordinates) and join each
    const lines = Array.from(yMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, lineItems]) =>
        lineItems.sort((a, b) => a.x - b.x).map((i) => i.str).join(' '),
      )

    // Accumulate lines per transaction; flush when the next date line starts
    let txnLines: string[] = []

    for (const line of lines) {
      if (DATE_RE.test(line)) {
        if (txnLines.length > 0) {
          const txn = parseSbiTxnText(txnLines.join(' '))
          if (txn) rows.push(txn)
        }
        txnLines = [line]
      } else if (txnLines.length > 0) {
        txnLines.push(line)
      }
    }
    // Flush the last transaction on this page
    if (txnLines.length > 0) {
      const txn = parseSbiTxnText(txnLines.join(' '))
      if (txn) rows.push(txn)
    }
  }

  if (rows.length === 0) {
    return {
      rows: [],
      parseError:
        'No transactions found in this SBI statement. ' +
        'Please ensure this is an SBI account statement PDF, or use the CSV export instead.',
    }
  }
  return { rows }
}

// ─── Regex-based profiles for other banks ────────────────────────────────────

interface BankProfile {
  name: string
  linePattern: RegExp
}

const REGEX_BANK_PROFILES: Record<Exclude<BankFormat, 'sbi'>, BankProfile> = {
  hdfc: {
    name: 'HDFC Bank',
    linePattern:
      /^(?<date>\d{2}\/\d{2}\/\d{4})\s+(?<particulars>.+?)\s{2,}(?:(?<debit>[\d,]+\.\d{2})\s+)?(?:(?<credit>[\d,]+\.\d{2})\s+)?(?<balance>[\d,]+\.\d{2})\s*$/,
  },
  icici: {
    name: 'ICICI Bank',
    linePattern:
      /^(?<date>\d{2}-\d{2}-\d{4})\s+(?<particulars>.+?)\s{2,}(?:(?<debit>[\d,]+\.\d{2})\s+)?(?:(?<credit>[\d,]+\.\d{2})\s+)?(?<balance>[\d,]+\.\d{2})\s*$/,
  },
  axis: {
    name: 'Axis Bank',
    linePattern:
      /^(?<date>\d{2}-\d{2}-\d{4})\s+(?<particulars>.+?)\s{2,}(?:(?<debit>[\d,]+\.\d{2})\s+)?(?:(?<credit>[\d,]+\.\d{2})\s+)?(?<balance>[\d,]+\.\d{2})\s*$/,
  },
  generic: {
    name: 'Generic (auto-detect)',
    linePattern:
      /^(?<date>\d{1,2}[\/\- ]\d{1,2}[\/\- ]\d{2,4}|\d{2} \w{3} \d{4})\s+(?<particulars>.+?)\s{2,}(?:(?<debit>[\d,]+\.?\d*)\s+)?(?:(?<credit>[\d,]+\.?\d*)\s+)?(?<balance>[\d,]+\.?\d*)\s*$/,
  },
}

async function parseWithRegex(
  file: File,
  format: Exclude<BankFormat, 'sbi'>,
): Promise<{ rows: ParsedStatementRow[]; parseError?: string }> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page    = await pdf.getPage(p)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ')
    fullText += pageText + '\n'
  }

  const profile = REGEX_BANK_PROFILES[format]
  const rows: ParsedStatementRow[] = []

  for (const line of fullText.split('\n')) {
    const trimmed = line.trim()
    const match   = trimmed.match(profile.linePattern)
    if (!match?.groups) continue

    const { date, particulars, debit, credit, balance } = match.groups
    const inc  = parseAmount(credit)
    const exp  = parseAmount(debit)
    const bal  = parseAmount(balance)
    const part = particulars.trim()
    if (!date || (!inc && !exp)) continue

    rows.push({
      date:        normDate(date),
      particulars: part,
      expenditure: exp,
      income:      inc,
      balance:     bal,
      paymentMode: 'Online',
      category:    guessCategory(part, inc !== null && inc > 0),
      apartment:   '',
      include:     true,
    })
  }

  if (rows.length === 0) {
    return {
      rows: [],
      parseError:
        "Couldn't find transactions in this PDF using the selected bank format. " +
        "Please try a different format or use your bank's CSV export instead.",
    }
  }
  return { rows }
}

// ─── Public API ───────────────────────────────────────────────────────────────

const BANK_NAMES: Record<BankFormat, string> = {
  sbi:     'State Bank of India',
  hdfc:    'HDFC Bank',
  icici:   'ICICI Bank',
  axis:    'Axis Bank',
  generic: 'Generic (auto-detect)',
}

export async function parsePdfFile(
  file: File,
  bankFormat: BankFormat = 'sbi',
): Promise<{ rows: ParsedStatementRow[]; parseError?: string }> {
  try {
    if (bankFormat === 'sbi') return parseSbiStatement(file)
    return parseWithRegex(file, bankFormat)
  } catch (err) {
    return {
      rows: [],
      parseError: `PDF parsing failed: ${(err as Error).message}. Please use CSV export instead.`,
    }
  }
}

export const BANK_FORMAT_OPTIONS = (Object.entries(BANK_NAMES) as [BankFormat, string][]).map(
  ([value, label]) => ({ value, label }),
)
