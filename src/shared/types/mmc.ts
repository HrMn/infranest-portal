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
