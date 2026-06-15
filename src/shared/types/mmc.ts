export interface MMCRateRow {
  aptType: string
  amount:  number | null
  revenue: number | null
}

export interface MMCRateRevision {
  effectiveFrom: string
  rates: MMCRateRow[]
}

export interface MMCRates {
  revisions: MMCRateRevision[]
}

export interface MMCPaidApartment {
  slNo: number
  owner: string
  type: string
  apartment: string
  totalPaid: number
  payments: Record<string, number | null>  // null = nothing recorded, >0 = amount paid
}

export interface MMCPaid {
  months: string[]
  apartments: MMCPaidApartment[]
  summary: {
    totalApartments: number
    totalCollected: number
    collectedThisFY: number
    paidThisMonth: number
    currentMonth: string
  }
}

export interface MMCApartment {
  slNo: number
  owner: string
  type: string
  ownerType: string
  apartment: string
  occupied: boolean
  totalDue: number
  collections: Record<string, number | null>  // value = outstanding due (0 = cleared, >0 = owed, null = future)
}

export interface MMCStatus {
  months: string[]
  apartments: MMCApartment[]
  summary: {
    totalApartments: number
    occupiedApartments: number
    totalOutstanding: number
    dueThisFY: number
    clearedThisMonth: number
    pendingThisMonth: number
    collectionRateThisMonth: number
    currentMonth: string
  }
}
