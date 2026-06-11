export interface Resident {
  slNo: number
  ownerType: string
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
