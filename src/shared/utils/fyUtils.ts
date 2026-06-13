/**
 * Derives the fiscal year key (e.g. "FY26-27") from a DD/MM/YYYY date string.
 * Indian FY runs April → March.
 * Returns null if the date string is incomplete or invalid.
 */
export function dateToFY(ddMmYyyy: string): string | null {
  const m = ddMmYyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const month = parseInt(m[2], 10)
  const year  = parseInt(m[3], 10)
  if (!month || !year || month < 1 || month > 12) return null
  const startYear = month >= 4 ? year : year - 1
  const startYY   = String(startYear).slice(-2)
  const endYY     = String(startYear + 1).slice(-2)
  return `FY${startYY}-${endYY}`
}

/** Today formatted as DD/MM/YYYY */
export function todayDDMMYYYY(): string {
  const d  = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}
