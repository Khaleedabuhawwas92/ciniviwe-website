import { timingSafeEqual, createHash } from 'node:crypto'
import rateLimit from 'express-rate-limit'
import cors from 'cors'

/** CORS limited to the configured website origins. Requests without an Origin (curl, server-to-server) are allowed. */
export function corsMiddleware(allowedOrigins) {
  return cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      return callback(null, false)
    },
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
}

/** Rate limit for the public contact endpoint (per client IP). */
export function contactRateLimit({ windowMs, max }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(_req, res) {
      res.status(429).json({
        success: false,
        message: 'لقد تجاوزت عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً.',
      })
    },
  })
}

/** Looser limit for the admin API (brute-force protection for the key). */
export const adminRateLimit = () =>
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false })

const digest = (value) => createHash('sha256').update(value).digest()

/**
 * Bearer-token guard for /api/admin. When no ADMIN_API_KEY is configured the admin API responds 404,
 * as if it did not exist. Replace with real user auth when the admin dashboard is built.
 */
export function requireAdmin(apiKey) {
  const expected = apiKey ? digest(apiKey) : null
  return (req, res, next) => {
    if (!expected) return res.status(404).json({ success: false, message: 'Not found' })
    const header = req.get('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
    if (!token || !timingSafeEqual(digest(token), expected)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    next()
  }
}
