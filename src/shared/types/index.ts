export * from './auth'
export * from './transaction'
export * from './mmc'
export * from './resident'
export * from './report'
export * from './config'
export * from './financialSummary'

export interface GasResponse<T> {
  success: boolean
  data: T
  timestamp: string
}

export interface GasError {
  success: false
  error: {
    code: string
    message: string
  }
}
