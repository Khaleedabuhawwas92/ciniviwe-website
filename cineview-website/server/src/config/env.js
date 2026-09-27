import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Load server/.env when present (Node >= 20.12). Real environment variables always win.
const envFile = fileURLToPath(new URL('../../.env', import.meta.url))
if (existsSync(envFile) && process.env.NODE_ENV !== 'test') process.loadEnvFile(envFile)

const str = (name, fallback = '') => (process.env[name] ?? fallback).trim()
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

/** Reads configuration from environment variables. Called once at startup (and per test). */
export function loadConfig() {
  const nodeEnv = str('NODE_ENV', 'development')
  const adminApiKey = str('ADMIN_API_KEY')

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    port: int('PORT', 4000),
    mongoUri: str('MONGO_URI'),
    // Comma-separated list of allowed browser origins, e.g. "https://cineview.com,https://www.cineview.com"
    corsOrigins: list('CORS_ORIGINS', nodeEnv === 'production' ? '' : 'http://localhost:5173,http://localhost:4173'),
    // Number of reverse proxies in front of the app (Vercel/Render/Nginx = 1). Needed for correct client IPs.
    trustProxy: int('TRUST_PROXY', 0),

    rateLimit: {
      windowMs: int('CONTACT_RATE_LIMIT_WINDOW_MINUTES', 15) * 60 * 1000,
      max: int('CONTACT_RATE_LIMIT_MAX', 5),
    },

    // Used to hash client IPs before storage (raw IPs are never saved).
    ipHashSecret: str('IP_HASH_SECRET'),

    // Admin API is disabled unless a sufficiently long key is configured.
    adminApiKey: adminApiKey.length >= 32 ? adminApiKey : '',
    adminApiKeyTooShort: adminApiKey.length > 0 && adminApiKey.length < 32,

    mail: {
      to: list('CONTACT_NOTIFICATION_EMAIL'),
      host: str('SMTP_HOST'),
      port: int('SMTP_PORT', 587),
      // true for port 465 (implicit TLS); false for 587/25 (STARTTLS is still used when offered).
      secure: bool('SMTP_SECURE', int('SMTP_PORT', 587) === 465),
      user: str('SMTP_USER'),
      pass: process.env.SMTP_PASS ?? '',
      from: str('SMTP_FROM'),
      timezone: str('NOTIFICATION_TIMEZONE', 'Asia/Riyadh'),
    },
  }
}

export const isMailConfigured = (mail) => Boolean(mail.host && mail.from && mail.to.length)
