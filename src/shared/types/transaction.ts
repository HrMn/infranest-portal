export type PaymentMode = 'Cash' | 'Online' | 'UPI' | 'NEFT' | 'RTGS' | 'Cheque'
export type PaymentType = 'Debit' | 'Credit'

export type IncomeCategory =
  | 'MMC Collection'
  | 'FD Interest'
  | 'Water Recovery'
  | 'Gas Recovery'
  | 'Donations'
  | 'Other Income'

export type ExpenseCategory =
  | 'Electricity'
  | 'Gas Cylinder'
  | 'Water Tanker'
  | 'STP Operations'
  | 'Lift AMC'
  | 'Fire AMC'
  | 'STP AMC'
  | 'Security Charges'
  | 'Caretaker Charges'
  | 'Cleaning Charges'
  | 'Sewage Collection'
  | 'Plumbing'
  | 'Electrical Repairs'
  | 'Building Maintenance'
  | 'Miscellaneous'

export type TransactionCategory = IncomeCategory | ExpenseCategory

export type TransactionSource = 'Manual' | 'Statement Import' | ''

export interface Transaction {
  rowIndex: number
  date: string
  particulars: string
  expenditure: number | null
  income: number | null
  paymentMode: PaymentMode | string
  paymentType: PaymentType | string
  apartment: string
  receiptNo: string
  voucherNo: string
  remarks: string
  status: string
  transactionId: string
  source: TransactionSource | string
  importedBy: string
  importedOn: string
  category: TransactionCategory | string  // derived from Particulars, not stored
}

export interface TransactionCreatePayload {
  date: string
  particulars: string
  expenditure: number | null
  income: number | null
  paymentMode: string
  paymentType: string
  apartment: string
  receiptNo: string
  voucherNo: string
  remarks: string
  status: string
}

export interface TransactionSummary {
  totalIncome: number
  totalExpense: number
  netBalance: number
  count: number
  incomeByCategory: Array<{ category: string; amount: number }>
  expenseByCategory: Array<{ category: string; amount: number }>
}

// Shape of a parsed row from a bank statement (before it becomes a Transaction)
export interface ParsedStatementRow {
  date: string
  particulars: string         // formatted display (e.g. "MMC - 1A - Apr-2026" for income)
  expenditure: number | null
  income: number | null
  balance: number | null
  paymentMode: string
  category: string
  apartment: string           // auto-detected from Mapping_Data; user can override
  include: boolean            // user can deselect rows before import
  outOfRange?: boolean        // true when date falls outside the selected FY
  remarks?: string            // original bank statement description
  refNo?: string              // cheque / reference number
}
