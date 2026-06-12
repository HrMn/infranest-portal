export interface Resident {
  slNo: number
  owner: string       // col B — owner name
  type: string        // col C — type classification
  ownerType: string   // combined "owner | type" for display
  apartment: string
  mobile?: string
  email?: string
  occupied: boolean
  category: string
  subcategory: string
  occupantDetails: string
  adults: number
  kids: number
  total: number
}
