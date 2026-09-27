const PHONE_LIKE = /^[+-][\d\s()-]+$/

/**
 * Escapes one CSV cell. Values that a spreadsheet would treat as a formula (=, +, -, @, tab, CR)
 * are prefixed with an apostrophe (CSV injection) — except plain phone numbers like "+966 5…".
 */
export function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text) && !PHONE_LIKE.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Rows → CSV text with a UTF-8 BOM (so Excel shows Arabic correctly) and CRLF line endings. */
export function toCsv(header, rows) {
  return '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
