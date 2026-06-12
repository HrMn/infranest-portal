export type PaymentMode = 'Cash' | 'UPI' | 'NEFT' | 'RTGS' | 'Cheque' | 'Online'
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
  status: string            // col K — e.g. Done, Pending, Cleared
  category: TransactionCategory | string  // derived from Particulars, not a sheet column
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
