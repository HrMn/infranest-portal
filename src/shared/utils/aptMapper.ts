export interface AptMappingEntry {
  aptKey: string    // e.g. "HARI, SARANYA"
  apartment: string // e.g. "1C"
}

function normalize(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/**
 * Match a bank transaction description against the Mapping_Data keyword list.
 * Normalizes both sides (uppercase, strip non-alphanumeric) so "KRISH NAK" matches
 * keyword "KRISHNAK", and vice-versa.
 * Returns the apartment code for the first matching keyword, or '' if none match.
 */
export function matchApartment(description: string, entries: AptMappingEntry[]): string {
  if (!description || !entries.length) return ''
  const normalizedDesc = normalize(description)

  for (const entry of entries) {
    const keywords = entry.aptKey.split(',').map((k) => k.trim()).filter(Boolean)
    for (const kw of keywords) {
      const normalizedKw = normalize(kw)
      if (normalizedKw.length >= 3 && normalizedDesc.includes(normalizedKw)) {
        return entry.apartment
      }
    }
  }
  return ''
}
