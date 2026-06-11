import dayjs from 'dayjs'

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-IN').format(value)
}

export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—'
  return `${value.toFixed(decimals)}%`
}

export function formatDate(dateStr: string | null | undefined, format = 'DD MMM YYYY'): string {
  if (!dateStr) return '—'
  const d = dayjs(dateStr)
  return d.isValid() ? d.format(format) : dateStr
}

export function currentMonthLabel(): string {
  return dayjs().format('MMM-YYYY')
}

export function fyMonthToDate(fyMonth: string): dayjs.Dayjs {
  return dayjs(fyMonth, 'MMM-YYYY')
}

export function surplusColor(value: number): string {
  if (value > 0) return '#52c41a'
  if (value < 0) return '#ff4d4f'
  return '#8c8c8c'
}

export function collectionRateColor(rate: number): string {
  if (rate >= 80) return '#52c41a'
  if (rate >= 50) return '#faad14'
  return '#ff4d4f'
}
