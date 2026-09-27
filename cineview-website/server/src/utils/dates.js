// Timezone-aware date helpers (no dependencies). "Days" are calendar days in the configured timezone.

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function zoneOffsetMs(instant, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  )
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000
}

/** "YYYY-MM-DD" → the UTC instant at which that day starts in `timeZone` (null when invalid). */
export function startOfZonedDay(dateString, timeZone) {
  const match = DATE_ONLY.exec(String(dateString || ''))
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  const guess = new Date(Date.UTC(y, m - 1, d))
  if (guess.getUTCMonth() !== m - 1) return null // e.g. 2026-02-31
  return new Date(guess.getTime() - zoneOffsetMs(guess, timeZone))
}

/** Start of the day after "YYYY-MM-DD" (exclusive upper bound for "to" filters). */
export function startOfNextZonedDay(dateString, timeZone) {
  const start = startOfZonedDay(dateString, timeZone)
  if (!start) return null
  const next = new Date(start.getTime() + 36 * 3600 * 1000) // safely inside the next day
  return startOfZonedDay(zonedDateKey(next, timeZone), timeZone)
}

/** Instant → "YYYY-MM-DD" in `timeZone`. */
export function zonedDateKey(instant, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    instant,
  )
}

/** The last `count` calendar-day keys in `timeZone`, oldest first (today last). */
export function lastZonedDays(count, timeZone, now = new Date()) {
  const keys = []
  let cursor = startOfZonedDay(zonedDateKey(now, timeZone), timeZone)
  for (let i = 0; i < count; i++) {
    keys.unshift(zonedDateKey(cursor, timeZone))
    cursor = startOfZonedDay(zonedDateKey(new Date(cursor.getTime() - 12 * 3600 * 1000), timeZone), timeZone)
  }
  return keys
}
