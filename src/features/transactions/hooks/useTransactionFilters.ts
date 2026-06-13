import { useState, useMemo } from 'react'
import { Transaction } from '@/shared/types'
import { FY_MONTHS } from '@/shared/utils/constants'

// FY_MONTHS keys are FiscalYear — allow any string for forward-compat
type FYString = string

export function useTransactionFilters(transactions: Transaction[] | undefined, fy: FYString) {
  const [month,    setMonth]    = useState('')
  const [category, setCategory] = useState('')
  const [search,   setSearch]   = useState('')

  const months = useMemo(() => {
    return (FY_MONTHS as Record<string, string[]>)[fy] ?? []
  }, [fy])

  const categories = useMemo(() => {
    const set = new Set((transactions ?? []).map((t) => t.category).filter(Boolean))
    return Array.from(set).sort()
  }, [transactions])

  const filtered = useMemo(() => {
    let rows = transactions ?? []

    if (month) {
      rows = rows.filter((t) => {
        const parts = t.date.split('/')
        if (parts.length !== 3) return false
        const d = new Date(+parts[2], +parts[1] - 1, +parts[0])
        const label = d.toLocaleString('en', { month: 'short' }) + '-' + d.getFullYear()
        return label === month
      })
    }

    if (category) {
      rows = rows.filter((t) => t.category === category)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(
        (t) =>
          t.particulars.toLowerCase().includes(q) ||
          t.apartment.toLowerCase().includes(q) ||
          t.remarks.toLowerCase().includes(q),
      )
    }

    return rows
  }, [transactions, month, category, search])

  const totals = useMemo(() => {
    const totalIncome  = filtered.reduce((s, t) => s + (t.income  ?? 0), 0)
    const totalExpense = filtered.reduce((s, t) => s + (t.expenditure ?? 0), 0)
    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      count: filtered.length,
    }
  }, [filtered])

  return {
    filtered,
    totals,
    months,
    categories,
    month,  setMonth,
    category, setCategory,
    search, setSearch,
  }
}
