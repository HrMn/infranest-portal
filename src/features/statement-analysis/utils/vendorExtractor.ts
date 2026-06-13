const PAYMENT_PREFIXES = /^(NEFT|UPI|IMPS|RTGS|ATM|POS|EMI|ECS|ACH|NACH|CLG|INB|MOB|SI)\b/i
const NUMERIC_ONLY     = /^\d+$/

/**
 * Extracts a short vendor/party name from a cleaned bank description.
 * Splits on * or / (common in NEFT/UPI/IMPS references), skips payment-method
 * prefixes and numeric-only tokens, and returns the first meaningful segment.
 * If no split is found the full description is returned as-is.
 *
 * Examples:
 *   "NEFT*KRISHNA ELECTRICALS*REF123"  → "KRISHNA ELECTRICALS"
 *   "UPI/9876543210/RAMESH KUMAR/REF"  → "RAMESH KUMAR"
 *   "SALARY CREDIT"                    → "SALARY CREDIT"
 */
export function extractVendorName(description: string): string {
  // Strip trailing [REF...] appended by the Excel parser
  const cleaned = description.replace(/\s*\[.*?\]\s*$/, '').trim()

  const parts = cleaned.split(/[*/]/).map((s) => s.trim()).filter(Boolean)
  if (parts.length <= 1) return cleaned

  const meaningful = parts.filter(
    (p) => !PAYMENT_PREFIXES.test(p) && !NUMERIC_ONLY.test(p) && p.length > 2,
  )

  return meaningful[0] || cleaned
}
