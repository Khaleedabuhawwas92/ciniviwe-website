import rateLimit from 'express-rate-limit'
import cors from 'cors'

/**
 * CORS limited to the configured origins (website + admin dashboard).
 * Credentials are allowed for the admin refresh cookie, so the list must never contain "*".
 * Requests without an Origin (curl, server-to-server) are allowed — they are not browser-bound.
 */
export function corsMiddleware(allowedOrigins) {
  const origins = allowedOrigins.filter((origin) => origin !== '*')
  return cors({
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) return callback(null, true)
      return callback(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 600,
  })
}

const limiter = (options, message) =>
  rateLimit({
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ...options,
    handler(_req, res) {
      res.status(429).json({ success: false, message })
    },
  })

const TOO_MANY = 'لقد تجاوزت عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً.'

/** Rate limit for the public contact endpoint (per client IP). */
export const contactRateLimit = ({ windowMs, max }) => limiter({ windowMs, limit: max }, TOO_MANY)

/**
 * Admin login: failed attempts only, counted per IP and per account identifier,
 * so neither a single IP nor a distributed attack can brute-force one account.
 */
export function loginRateLimits({ windowMs, max }) {
  const message = 'محاولات دخول كثيرة. يرجى الانتظار قليلاً ثم المحاولة مجدداً.'
  return [
    limiter({ windowMs, limit: max, skipSuccessfulRequests: true }, message),
    limiter(
      {
        windowMs,
        limit: max,
        skipSuccessfulRequests: true,
        keyGenerator: (req) => {
          const id = req.body?.usernameOrEmail
          return `account:${typeof id === 'string' ? id.trim().toLowerCase().slice(0, 120) : ''}`
        },
      },
      message,
    ),
  ]
}

/** General limit for authenticated admin API calls. */
export const adminRateLimit = () => limiter({ windowMs: 15 * 60 * 1000, limit: 1000 }, TOO_MANY)

/**
 * CSRF defence for the cookie-authenticated endpoints (refresh / logout):
 * the request must come from an allowed Origin (when the browser sends one) and carry a custom
 * header, which cross-site forms cannot set without passing CORS.
 */
export function requireTrustedOrigin(allowedOrigins) {
  return (req, res, next) => {
    const origin = req.get('origin')
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ success: false, message: 'مصدر الطلب غير مسموح.' })
    }
    if (req.get('x-requested-with') !== 'XMLHttpRequest') {
      return res.status(403).json({ success: false, message: 'طلب غير صالح.' })
    }
    next()
  }
}
