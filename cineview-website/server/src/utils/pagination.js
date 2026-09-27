const clampInt = (value, fallback, min, max) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback
}

/** ?page=&limit= → safe integers (limit capped at 100). */
export const parsePagination = (query = {}, { defaultLimit = 20 } = {}) => ({
  page: clampInt(query.page, 1, 1, 100_000),
  limit: clampInt(query.limit, defaultLimit, 1, 100),
})
