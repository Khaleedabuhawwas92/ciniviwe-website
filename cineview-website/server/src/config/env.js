import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Load server/.env when present (Node >= 20.12). Real environment variables always win.
const envFile = fileURLToPath(new URL('../../.env', import.meta.url))
if (existsSync(envFile) && process.env.NODE_ENV !== 'test') process.loadEnvFile(envFile)

// An empty value ("KEY=") counts as unset, so documented defaults still apply.
const str = (name, fallback = '') => {
  const value = (process.env[name] ?? '').trim()
  return value || String(fallback).trim()
}
const int = (name, fallback) => {
  const value = Number.parseInt(process.env[name] ?? '', 10)
  return Number.isFinite(value) ? value : fallback
}
const bool = (name, fallback = false) => {
  const value = str(name).toLowerCase()
  return value ? ['1', 'true', 'yes'].includes(value) : fallback
}
const list = (name, fallback = '') =>
  str(name, fallback)
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean)

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86_400 }
/** Durations like "15m", "12h", "7d" (or plain seconds) → seconds. */
const duration = (name, fallback) => {
  const match = /^(\d+)\s*([smhd]?)$/i.exec(str(name, fallback)) || /^(\d+)\s*([smhd]?)$/i.exec(fallback)
  return Number(match[1]) * UNIT_SECONDS[(match[2] || 's').toLowerCase()]
}

/** Reads configuration from environment variables. Called once at startup (and per test). */
export function loadConfig() {
  const nodeEnv = str('NODE_ENV', 'development')
  const isProduction = nodeEnv === 'production'
  const timezone = str('APP_TIMEZONE') || str('NOTIFICATION_TIMEZONE', 'Asia/Riyadh')
  const jwtSecret = str('ADMIN_JWT_SECRET')

  return {
    nodeEnv,
    isProduction,
    port: int('PORT', 4000),
    mongoUri: str('MONGO_URI'),
    // Allowed browser origins (website + admin dashboard), comma-separated, e.g.
    // "https://cineview.com,https://admin.cineview.com". Never "*": admin requests carry credentials.
    corsOrigins: list(
      'CORS_ORIGINS',
      isProduction ? '' : 'http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4174',
    ),
    // Number of reverse proxies in front of the app (Render/Nginx/Cloudflare = 1). Needed for correct client IPs.
    trustProxy: int('TRUST_PROXY', 0),
    // Timezone used for "today / this month" statistics, date filters and email dates.
    timezone,

    rateLimit: {
      windowMs: int('CONTACT_RATE_LIMIT_WINDOW_MINUTES', 15) * 60 * 1000,
      max: int('CONTACT_RATE_LIMIT_MAX', 5),
    },

    // Used to hash client IPs before storage (raw IPs are never saved).
    ipHashSecret: str('IP_HASH_SECRET'),

    // The old static-key admin access was removed in favour of admin accounts.
    adminApiKeyDeprecated: Boolean(str('ADMIN_API_KEY')),

    auth: {
      // Signs short-lived access tokens. Required in production (>= 32 chars).
      jwtSecret,
      accessTokenTtlSec: duration('ADMIN_ACCESS_EXPIRES', '15m'),
      refreshTokenTtlSec: duration('ADMIN_REFRESH_EXPIRES', '7d'),
      bcryptRounds: int('ADMIN_BCRYPT_ROUNDS', 12),
      cookie: {
        name: 'cv_admin_rt',
        path: '/api/admin/auth',
        secure: bool('ADMIN_COOKIE_SECURE', isProduction),
        // 'strict' when the admin app and API share a site (admin.x.com + api.x.com);
        // 'none' (requires secure) only if they live on different sites.
        sameSite: str('ADMIN_COOKIE_SAMESITE', 'strict').toLowerCase(),
        domain: str('ADMIN_COOKIE_DOMAIN') || undefined,
      },
      loginRateLimit: {
        windowMs: int('ADMIN_LOGIN_RATE_LIMIT_WINDOW_MINUTES', 15) * 60 * 1000,
        max: int('ADMIN_LOGIN_RATE_LIMIT_MAX', 10),
      },
    },

    mail: {
      to: list('CONTACT_NOTIFICATION_EMAIL'),
      host: str('SMTP_HOST'),
      port: int('SMTP_PORT', 587),
      // true for port 465 (implicit TLS); false for 587/25 (STARTTLS is still used when offered).
      secure: bool('SMTP_SECURE', int('SMTP_PORT', 587) === 465),
      user: str('SMTP_USER'),
      pass: process.env.SMTP_PASS ?? '',
      from: str('SMTP_FROM'),
      timezone,
    },
  }
}

export const isMailConfigured = (mail) => Boolean(mail.host && mail.from && mail.to.length)
