export interface MMCApartment {
  slNo: number
  ownerType: string
  apartment: string
  occupied: boolean
  category: string
  subcategory: string
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
