export interface MMCApartment {
  slNo: number
  owner: string
  type: string
  ownerType: string   // combined "owner | type"
  apartment: string
  occupied: boolean
  collections: Record<string, number | null>
}

export interface MMCStatus {
  months: string[]
  apartments: MMCApartment[]
  summary: {
    totalApartments: number
    occupiedApartments: number
    collectedThisMonth: number
    outstandingThisMonth: number
    collectionRateThisMonth: number
    currentMonth: string
  }
}
