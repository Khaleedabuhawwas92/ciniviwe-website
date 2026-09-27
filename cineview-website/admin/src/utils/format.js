// Arabic formatting with Latin digits and the Gregorian calendar.
const LOCALE = 'ar-u-nu-latn-ca-gregory'

const dateTime = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' })
const timeOnly = new Intl.DateTimeFormat(LOCALE, { timeStyle: 'short' })
const dayShort = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: 'UTC' })
const dayMonth = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', timeZone: 'UTC' })
const numberFormat = new Intl.NumberFormat(LOCALE)
const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

const toDate = (value) => (value instanceof Date ? value : new Date(value))
const valid = (d) => d instanceof Date && !Number.isNaN(d.getTime())

export const formatDateTime = (value) => (value && valid(toDate(value)) ? dateTime.format(toDate(value)) : '—')
export const formatDate = (value) => (value && valid(toDate(value)) ? dateOnly.format(toDate(value)) : '—')
export const formatTime = (value) => (value && valid(toDate(value)) ? timeOnly.format(toDate(value)) : '')
export const formatNumber = (value) => numberFormat.format(value ?? 0)

/** "YYYY-MM-DD" (a calendar day) → short weekday / day-month labels. */
export const weekdayOf = (key) => dayShort.format(new Date(`${key}T12:00:00Z`))
export const dayMonthOf = (key) => dayMonth.format(new Date(`${key}T12:00:00Z`))

/** "منذ 5 دقائق" style relative time (falls back to the date after a week). */
export function timeAgo(value) {
  const date = toDate(value)
  if (!valid(date)) return '—'
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return 'الآن'
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute')
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), 'hour')
  if (abs < 7 * 86_400) return relative.format(Math.round(seconds / 86_400), 'day')
  return formatDate(date)
}
